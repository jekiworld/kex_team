package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/dgrijalva/jwt-go"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"io/ioutil"
	"log"
	"math/rand"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// User модель пользователя
type User struct {
	gorm.Model
	FirstName        string    `json:"first_name"`
	LastName         string    `json:"last_name"`
	Email            string    `json:"email"`
	Username         string    `json:"username"`
	Password         string    `json:"password"`
	ConfirmPassword  string    `json:"confirm_password"`
	Phone            string    `json:"phone"`
	VerificationCode string    `json:"-"` // Код верификации, не выводится в JSON
	VerificationTime time.Time `json:"-"` // Время создания кода верификации
	IsVerified       bool      `json:"-"` // Статус верификации
}

// JWTClaims структура для хранения данных в токене
type JWTClaims struct {
	Username string `json:"username"`
	jwt.StandardClaims
}

var jwtKey = []byte("secret_key")
var db *gorm.DB

type WooppayAuthResponse struct {
	Token string `json:"token"`
}

type WooppayInvoiceResponse struct {
	OperationURL string `json:"operation_url"`
}

const (
	wooppayBaseURL = "https://api-core.wooppay.com/v1"
	wooppayLogin   = "77052975321"
	wooppayPass    = "Jekiworld123@"
)

// Создаем и возвращаем JWT токен
func createToken(username string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour) // Токен будет действителен в течение 24 часов
	claims := &JWTClaims{
		Username: username,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// Проверяем токен
func validateToken(tokenString string) (string, error) {
	claims := &JWTClaims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})

	if err != nil {
		return "", err
	}

	if !token.Valid {
		return "", fmt.Errorf("Invalid token")
	}

	return claims.Username, nil
}

// Генерация кода верификации
func generateVerificationCode() string {
	rand.Seed(time.Now().UnixNano())
	return fmt.Sprintf("%06d", rand.Intn(1000000)) // Генерация шестизначного кода
}

// Функция для отправки SMS через smsc.kz с использованием метода GET
func sendSMS(login, password, phones, message string) (string, error) {
	baseURL := "https://smsc.kz/sys/send.php"
	params := url.Values{
		"login":  {login},
		"psw":    {password},
		"phones": {phones},
		"mes":    {message},
	}

	// Формирование URL с параметрами
	fullURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())

	// Выполнение GET запроса
	response, err := http.Get(fullURL)
	if err != nil {
		return "", err
	}
	defer response.Body.Close()

	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil
}

// Отправка кода верификации по SMS
func sendVerificationCode(phone, code string) error {
	message := fmt.Sprintf("Привет, ваш код: %s", code)
	_, err := sendSMS("Jekiworld", "Bahredin123", phone, message)
	return err
}

// Авторизация в Wooppay и получение токена
func wooppayAuth() (string, error) {
	authURL := fmt.Sprintf("%s/auth", wooppayBaseURL)
	authData := map[string]string{
		"login":    wooppayLogin,
		"password": wooppayPass,
	}
	jsonData, err := json.Marshal(authData)
	if err != nil {
		return "", err
	}

	resp, err := http.Post(authURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to authenticate with Wooppay, status: %d", resp.StatusCode)
	}

	var authResponse WooppayAuthResponse
	err = json.NewDecoder(resp.Body).Decode(&authResponse)
	if err != nil {
		return "", err
	}

	log.Printf("Wooppay Auth Token: %s", authResponse.Token)

	return authResponse.Token, nil
}

// Создание счета на оплату в Wooppay
func createWooppayInvoice(amount float64, phone string) (string, error) {
	token, err := wooppayAuth()
	if err != nil {
		log.Printf("Error in Wooppay Auth: %v", err)
		return "", err
	}

	invoiceURL := fmt.Sprintf("%s/invoice/create", wooppayBaseURL)
	invoiceData := map[string]interface{}{
		"reference_id":   fmt.Sprintf("%d", time.Now().Unix()),
		"amount":         amount,
		"merchant_name":  wooppayLogin,
		"user_phone":     phone,
		"request_url":    "http://yourdomain.com/payment-callback",
		"service_name":   "wooppay_invoice",
		"card_forbidden": "0",
	}
	jsonData, err := json.Marshal(invoiceData)
	if err != nil {
		log.Printf("Error in Marshal Invoice Data: %v", err)
		return "", err
	}

	req, err := http.NewRequest("POST", invoiceURL, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Error in NewRequest: %v", err)
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error in Do Request: %v", err)
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := ioutil.ReadAll(resp.Body)
		bodyString := string(bodyBytes)
		log.Printf("Failed to create invoice with Wooppay, status: %d, response: %s", resp.StatusCode, bodyString)
		return "", fmt.Errorf("failed to create invoice with Wooppay, status: %d, response: %s", resp.StatusCode, bodyString)
	}

	var invoiceResponse WooppayInvoiceResponse
	err = json.NewDecoder(resp.Body).Decode(&invoiceResponse)
	if err != nil {
		log.Printf("Error in Decode Invoice Response: %v", err)
		return "", err
	}

	log.Printf("Wooppay Invoice URL: %s", invoiceResponse.OperationURL)

	return invoiceResponse.OperationURL, nil
}

// Обработчик регистрации пользователя
func registerHandler(c *gin.Context) {
	var user User
	if err := c.BindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	if user.Password != user.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Passwords do not match"})
		return
	}

	user.VerificationCode = generateVerificationCode()
	user.VerificationTime = time.Now()

	// Логирование кода верификации перед сохранением
	log.Printf("Register: Generated verification code: %s for phone: %s", user.VerificationCode, user.Phone)

	// Отправляем SMS с кодом верификации
	if err := sendVerificationCode(user.Phone, user.VerificationCode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send verification SMS"})
		return
	}

	// Проверка, есть ли уже пользователь с таким телефоном
	var existingUser User
	if db.Where("phone = ?", user.Phone).First(&existingUser).RecordNotFound() {
		// Пользователя нет, создаем нового
		if err := db.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save user"})
			return
		}
	} else {
		// Пользователь уже существует, обновляем его данные
		existingUser.VerificationCode = user.VerificationCode
		existingUser.VerificationTime = user.VerificationTime
		existingUser.FirstName = user.FirstName
		existingUser.LastName = user.LastName
		existingUser.Email = user.Email
		existingUser.Username = user.Username
		existingUser.Password = user.Password
		if err := db.Save(&existingUser).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Verification SMS sent"})
}

// Обработчик для подтверждения кода
func verifyCodeHandler(c *gin.Context) {
	var verification struct {
		Phone string `json:"phone"`
		Code  string `json:"code"`
	}

	if err := c.BindJSON(&verification); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	var user User
	result := db.Where("phone = ?", verification.Phone).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	currentTime := time.Now()
	log.Printf("VerificationTime: %s, CurrentTime: %s", user.VerificationTime, currentTime)

	if time.Since(user.VerificationTime) > 60*time.Minute {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Verification code expired"})
		return
	}

	log.Printf("Verify: Expected code: %s, Received code: %s", user.VerificationCode, verification.Code)

	if user.VerificationCode != verification.Code {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid code"})
		return
	}

	user.IsVerified = true
	db.Save(&user)

	token, err := createToken(user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token, "message": "User registered successfully"})
}

// Обработчик входа пользователя и выдачи токена
func loginHandler(c *gin.Context) {
	var credentials struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.BindJSON(&credentials); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	var user User
	result := db.Where("email = ? AND password = ?", credentials.Email, credentials.Password).First(&user)
	if result.Error != nil || !user.IsVerified {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	token, err := createToken(user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

// Обработчик выхода пользователя
func logoutHandler(c *gin.Context) {
	// В данном случае нам не нужно делать ничего на сервере, так как JWT токен является stateless
	// и не требует явного удаления на стороне сервера. Просто возвращаем успешный ответ.
	c.JSON(http.StatusOK, gin.H{"message": "User successfully logged out"})
}

// Обработчик получения данных профиля пользователя
func profileHandler(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Преобразуем user в тип User
	u, ok := user.(User)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": gin.H{
		"first_name": u.FirstName,
		"last_name":  u.LastName,
		"email":      u.Email,
		"username":   u.Username,
		"phone":      u.Phone,
	}})
}

// Обработчик создания платежа
func paymentHandler(c *gin.Context) {
	var payment struct {
		Amount float64 `json:"amount"`
		Phone  string  `json:"phone"`
	}

	if err := c.BindJSON(&payment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	operationURL, err := createWooppayInvoice(payment.Amount, payment.Phone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"operation_url": operationURL})
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header not provided"})
			c.Abort()
			return
		}

		// Разделяем заголовок на тип токена и сам токен
		fields := strings.Fields(authHeader)
		if len(fields) < 2 || fields[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := fields[1]

		// Validate token
		username, err := validateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Find user
		var user User
		if err := db.Where("username = ?", username).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		// Add user to context
		c.Set("user", user)
		c.Next()
	}
}

func main() {
	var err error
	dataSourceName := "postgres://kex_group_user:LxDBEaNSzOB1PAO6cbbgTkJF1AyDCbTs@dpg-cpbk7lfsc6pc73ab4jt0-a.singapore-postgres.render.com/kex_group"
	db, err = gorm.Open("postgres", dataSourceName)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	err = db.DB().Ping()
	if err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Connected to the database")

	db.AutoMigrate(&User{})

	router := gin.Default()

	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"} // Замените на ваш фронтенд-URL
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = append(config.AllowHeaders, "Authorization")
	router.Use(cors.New(config))

	router.POST("/register", registerHandler)
	router.POST("/verify_code", verifyCodeHandler)
	router.POST("/login", loginHandler)
	router.POST("/logout", logoutHandler)
	router.POST("/payment", paymentHandler) // Добавленный маршрут для создания платежа

	// Применение middleware к маршруту профиля
	protected := router.Group("/")
	protected.Use(authMiddleware())
	protected.GET("/profile", profileHandler)

	router.GET("/protected", func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token not provided"})
			return
		}

		username, err := validateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Welcome, %s! This is a protected resource.", username)})
	})

	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
