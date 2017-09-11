const express = require('express');
const bodyParser = require('body-parser');
const nodeFlags = require('node-flag')

const { getCafeteriaMenu, spellCheck, getKoreanWord, getWeatherImun } = require('./utils');

const port = process.env.PORT || nodeFlags.get('port') || 5000;

const app = express();
app.use(bodyParser.json());

app.post('/', (req, res) => {

    const response = {
        body: 'I love Pizza!'
    };

    res.send(response);
});

app.post('/cafeteria', (req, res) => {
    const text = req.body.text.replace(`/${req.body.keyword} `, '');

    if (
        text == '인문관 점심' ||
        text == '인문관 저녁' ||
        text == '교수회관 점심' ||
        text == '교수회관 저녁'
    ) {
        getCafeteriaMenu(text, menu => {
            sendData = {
                body: '맛나게 드세요.',
                connectInfo: [
                    {
                        title: text,
                        description: menu
                    }
                ]
            };
            res.send(sendData);
        });
        return;
    }

    sendData = {
        body: '아래 중 하나를 입력해주세요.',
        connectInfo: [
            {
                title: '명령어',
                description: '/학식 인문관 점심\n/학식 인문관 저녁\n/학식 교수회관 점심\n/학식 교수회관 저녁'
            }
        ]
    };
    res.send(sendData);
});

app.post('/spellCheck', (req, res) => {
    const text = req.body.text.replace(`/${req.body.keyword} `, '');

    if (text.match(/ 뜻$/)) {
        getKoreanWord(text, result => {
            sendData = {
                body: result
            };
            res.send(sendData);
        });
        return;
    } else {
        spellCheck(text, result => {
            sendData = {
                body: result
            };
            res.send(sendData);
            return;
        });
    }
});

app.post('/weatherImun', (req, res) => {
    getWeatherImun((weather) => {

        if (weather.err) {
            res.send({body: '서버 오류'});
        }

        sendData = {
            body: '현재 날씨입니다.',
            connectInfo: [
                {
                    title: weather.title,
                    description: weather.text
                }
            ]
        };

        res.send(sendData);
    })
})

app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});
