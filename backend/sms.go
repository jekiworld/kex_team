package main

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
)

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

func main() {
	router := gin.Default()

	// Эндпоинт для отправки SMS
	router.POST("/send_sms", func(c *gin.Context) {
		type request struct {
			Phones  string `json:"phones"`
			Message string `json:"message"`
		}

		var req request
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		// Используйте актуальные учетные данные для этого вызова
		response, err := sendSMS("Jekiworld", "Bahredin123", req.Phones, req.Message)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send SMS", "details": err.Error()})
			return
		}

		if strings.Contains(response, "ERROR = 2") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization error. Check your login and password."})
			return
		}

		c.JSON(http.StatusOK, gin.H{"response": response})
	})

	// Запуск сервера на порту 8080
	router.Run(":8080")
}

//psql -h dpg-cpbk7lfsc6pc73ab4jt0-a.frankfurt-postgres.render.com -U bakhredin -d sportkeshen z для интерактива

// psql -h dpg-cpbk7lfsc6pc73ab4jt0-a.singapore-postgres.render.com -U kex_group_user kex_group

//SELECT * FROM users;

// LxDBEaNSzOB1PAO6cbbgTkJF1AyDCbTs
