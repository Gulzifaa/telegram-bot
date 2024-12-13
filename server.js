const TelegramBot = require('node-telegram-bot-api');

// Токен бота
const token = '8096323479:AAEexEcmZ1zEhuu6vpoahTp1bdyAchXqZcc';
const bot = new TelegramBot(token, { polling: true });

// Хранилище данных для каждого игрока или пользователя
const users = {};
const inviteLink = 'https://t.me/+NaMMib1VhYMzM2Ey'; // Временная ссылка на канал

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    users[chatId] = { paymentConfirmed: false, linkGeneratedAt: null };

    bot.sendMessage(chatId, "Привет, ты в шаге от лучшей версии себя!\n\nВыбери ниже тариф для твоего перехода. После оплаты пришли мне скрин оплаты или PDF файл, для этого нажми кнопку: 'Я оплатил'.", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "10 000 KZT (1 месяц)", callback_data: "month" },
                    { text: "72 000 KZT (1 год)", callback_data: "year" }
                ]
            ]
        }
    });
});

// Обработка выбора подписки
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;

    try {
        if (query.data === 'month') {
            users[chatId].amount = '10 000 KZT';
            await bot.sendMessage(chatId, "Вы выбрали подписку на месяц. Сумма: 10 000 KZT.", {
                reply_markup: {
                    inline_keyboard: [[{ text: "Оплатить 10 000 KZT", callback_data: "pay_subscription" }]]
                }
            });
        }

        if (query.data === 'year') {
            users[chatId].amount = '72 000 KZT';
            await bot.sendMessage(chatId, "Вы выбрали подписку на год. Сумма: 72 000 KZT.", {
                reply_markup: {
                    inline_keyboard: [[{ text: "Оплатить 72 000 KZT", callback_data: "pay_subscription" }]]
                }
            });
        }

        if (query.data === 'pay_subscription') {
            await bot.sendMessage(chatId, "Перейдите по ссылке для оплаты: https://pay.kaspi.kz/pay/yt5x6cir. После оплаты нажмите 'Я оплатил' и загрузите скриншот или PDF.", {
                reply_markup: {
                    inline_keyboard: [[{ text: "Я оплатил", callback_data: "confirm_payment" }]]
                }
            });
        }

        if (query.data === 'confirm_payment') {
            await bot.sendMessage(chatId, "Отлично! Пришли скрин оплаты или PDF файл, и я отправлю тебе ссылку на закрытый канал.");
        }
    } catch (error) {
        console.error(`Ошибка в обработке callback_query: ${error.message}`);
        bot.sendMessage(chatId, "Произошла ошибка. Попробуйте ещё раз позже.");
    }
});

// Обработка загрузки скриншота или PDF
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    try {
        if (!users[chatId]) {
            users[chatId] = { paymentConfirmed: false, linkGeneratedAt: null };
        }

        if (msg.document || msg.photo) {
            users[chatId].paymentConfirmed = true;
            users[chatId].linkGeneratedAt = new Date();

            bot.sendMessage(chatId, `Ваш платёж подтверждён! Вот ваша временная ссылка для вступления в канал: ${inviteLink}\n\nСсылка действительна в течение 24 часов. Успейте перейти по ней и жди одобрения заявки!`);
        }
    } catch (error) {
        console.error(`Ошибка в обработке сообщения: ${error.message}`);
        bot.sendMessage(chatId, "Произошла ошибка при обработке вашего сообщения. Попробуйте ещё раз позже.");
    }
});

// Проверка, истекла ли ссылка
function isLinkExpired(generatedAt) {
    if (!generatedAt) return true;
    const now = new Date();
    const diff = now - generatedAt; // Разница в миллисекундах
    const hours = diff / (1000 * 60 * 60); // Перевод в часы
    return hours >= 24;
}

// Напоминание об истечении ссылки через 23 часа
setInterval(() => {
    const now = new Date();

    for (const chatId in users) {
        if (users[chatId].linkGeneratedAt && !isLinkExpired(users[chatId].linkGeneratedAt)) {
            const diff = now - users[chatId].linkGeneratedAt;
            const hours = diff / (1000 * 60 * 60);

            if (hours >= 23 && hours < 24) {
                bot.sendMessage(chatId, "Напоминаем, что ваша ссылка на канал скоро истечёт. Успейте перейти по ней!");
            }
        }
    }
}, 60 * 60 * 1000); // Проверяем каждые час

// Логирование ошибок polling
bot.on('polling_error', (error) => {
    console.error(`Ошибка polling: ${error.code} - ${error.message}`);
});

// Запуск бота
console.log('Бот запущен и готов к работе!');
