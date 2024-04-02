const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use(cors({
   origin: 'http://localhost:4200'
 }));

// Настройка транспорта для Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Функция для отправки уведомлений на электронную почту
function sendEmail(username, subject, text) {
   const mailOptions = {
     from: process.env.EMAIL_USER,
     to: username,
     subject,
     text
   };

   transporter.sendMail(mailOptions, function(error, info) {
     if (error) {
       console.log(error);
     } else {
       console.log('Email sent: ' + info.response);
     }
   });
 }

// Подключение к базе данных MongoDB
mongoose.connect(process.env.MONGO_URI);

// Схема пользователя
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

// Ограничение количества попыток ввода пароля
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
});

// Регистрация нового пользователя
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Проверка существования пользователя с таким же именем
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: 'Пользователь с таким именем уже существует' });
  }

  // Хеширование пароля
  const hashedPassword = crypto.createHash('md5').update(password).digest('hex');

  // Создание нового пользователя
  const newUser = new User({ username, password: hashedPassword });
  await newUser.save();

  // Отправка уведомления на электронную почту
  sendEmail(username, 'Регистрация', 'Вы успешно зарегистрировались');

  res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
});

// Аутентификация существующего пользователя
app.post('/login', limiter, async (req, res) => {
  const { username, password } = req.body;

  // Поиск пользователя в базе данных
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).json({ message: 'Неверное имя пользователя или пароль' });
  }

  // Хеширование пароля для сравнения
  const hashedPassword = crypto.createHash('md5').update(password).digest('hex');

  // Сравнение паролей
  if (hashedPassword !== user.password) {
    return res.status(400).json({ message: 'Неверное имя пользователя или пароль' });
  }

  // Генерация токена доступа
  const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' });

  res.json({ token });
});

// Проверка токена доступа
app.get('/profile', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];

  try {
    // Проверка и декодирование токена
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

    // Поиск пользователя в базе данных по id из токена
    const user = await User.findById(decodedToken.userId);
    if (!user) {
      return res.status(401).json({ message: 'Неверный токен доступа' });
    }

    res.json({ username: user.username });
  } catch (error) {
    res.status(401).json({ message: 'Неверный токен доступа' });
  }
});

// Маршрут для отправки электронной почты
app.post('/send-email', async (req, res) => {
  const { to, subject, text } = req.body;
  sendEmail(to, subject, text);
});

app.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});
