package main

import (
	"fmt"
	"github.com/dgrijalva/jwt-go"
	"github.com/gin-contrib/cors"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
)

// User модель пользователя
type User struct {
	gorm.Model
	FirstName       string `json:"first_name"`
	LastName        string `json:"last_name"`
	Email           string `json:"email"`
	Username        string `json:"username"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirm_password"` // Добавлено поле ConfirmPassword
}

// JWTClaims структура для хранения данных в токене
type JWTClaims struct {
	Username string `json:"username"`
	jwt.StandardClaims
}

var jwtKey = []byte("secret_key")

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

// Обработчик регистрации пользователя
func registerHandler(c *gin.Context) {
	var user User
	if err := c.BindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// Проверяем, что пароль и повтор пароля совпадают
	if user.Password != user.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Passwords do not match"})
		return
	}

	// Создаем нового пользователя в базе данных
	db.Create(&user)

	c.JSON(http.StatusOK, gin.H{"message": "User registered successfully"})
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

	// Проверяем наличие пользователя в базе данных
	var user User
	result := db.Where("email = ? AND password = ?", credentials.Email, credentials.Password).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Создаем и отправляем токен
	token, err := createToken(user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

var db *gorm.DB

func logoutHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Пользователь успешно вышел из системы"})
}

// Обработчик получения данных профиля пользователя
func profileHandler(c *gin.Context) {
	// Извлекаем пользователя из контекста Gin
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Возвращаем данные профиля пользователя
	c.JSON(http.StatusOK, gin.H{"user": user})
}

func main() {
	var err error
	dataSourceName := "postgres://kex_group_user:LxDBEaNSzOB1PAO6cbbgTkJF1AyDCbTs@dpg-cpbk7lfsc6pc73ab4jt0-a.singapore-postgres.render.com/kex_group"
	db, err = gorm.Open("postgres", dataSourceName)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Проверка подключения к базе данных
	err = db.DB().Ping()
	if err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	// Журналирование успешного подключения
	log.Println("Connected to the database")

	// Миграции для создания таблицы пользователей
	db.AutoMigrate(&User{})

	// Инициализация Gin
	router := gin.Default()

	// Добавьте middleware CORS
	// Добавьте middleware CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"} // Замените на ваш фронтенд-URL
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = append(config.AllowHeaders, "Authorization") // Добавьте Authorization в разрешенные заголовки
	router.Use(cors.New(config))

	// Регистрация маршрутов
	router.POST("/register", registerHandler)
	router.POST("/login", loginHandler)
	router.POST("/logout", logoutHandler) // Новый маршрут для выхода пользователя
	router.GET("/profile", profileHandler)

	// Защищенный маршрут, который требует токен для доступа
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

	// Запуск сервера на порту 8080
	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}

//psql -h dpg-cpbk7lfsc6pc73ab4jt0-a.frankfurt-postgres.render.com -U bakhredin -d sportkeshen z для интерактива

// psql -h dpg-cpbk7lfsc6pc73ab4jt0-a.singapore-postgres.render.com -U kex_group_user kex_group

//SELECT * FROM users;

//LxDBEaNSzOB1PAO6cbbgTkJF1AyDCbTs
