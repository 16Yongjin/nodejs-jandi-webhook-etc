const express = require('express');
const bodyParser = require('body-parser');
const nodeFlags = require('node-flag')

const { getCafeteriaMenu, spellCheck, getKoreanWord } = require('./utils');

const port = process.env.PORT || nodeFlags.get('port') || 5000;

const app = express();
app.use(bodyParser.json());

app.post('/', (req, res) => {
    console.log(req);
    console.log(req.body);

    const response = {
        body: 'I love Pizza!'
    };

    res.send(response);
});

app.post('/cafeteria', (req, res) => {
    console.log(req);
    console.log(req.body.text);
    const text = req.body.text.replace(`/${req.body.keyword}`, '');

    if (
        text == '인문관 점심' ||
        text == '인문관 저녁' ||
        text == '교수회관 점심' ||
        text == '교수회관 저녁'
    ) {
        getCafeteriaMenu(message, menu => {
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
                description: '인문관 점심\n인문관 저녁\n교수회관 점심\n교수회관 저녁'
            }
        ]
    };
    res.send(sendData);
});

app.post('/spellCheck', (req, res) => {
    console.log(req);
    console.log(req.body);

    if (message.match(/ 뜻$/)) {
        getKoreanWord(message, result => {
            sendData = {
                body: result
            };
            res.send(sendData);
        });
        return;
    } else {
        spellCheck(message, result => {
            sendData = {
                body: result
            };
            res.send(sendData);
            return;
        });
    }
});

app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});
