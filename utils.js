const request = require('request');
const client = require('cheerio-httpcli');
const cheerio = require('cheerio')
const parseString = require('xml2js').parseString;
// const FB = require('fb');


const moment = require('moment');

function getCafeteriaMenu(message, callback) {
    var place = message.split(' ')[0];
    var eatingTime = message.split(' ')[1];

    var today = new Date()
        .toISOString()
        .substring(0, 10)
        .replace(/-/g, '');
    var url = `https://webs.hufs.ac.kr/jsp/HUFS/cafeteria/viewWeek.jsp?startDt=${today}&endDt=${today}`;

    if (place == '인문관') url += '&caf_id=h101';
    else url += '&caf_id=h102';

    var menus = '';

    var re;
    if (eatingTime == '점심') re = /중식.+?\d+원/g;
    else re = /석식.+?\d+원/g;

    client.fetch(url, {}, function(err, $, res) {
        if (err) {
            console.log('Error : ', err);
            return;
        }
        var menu = $('table')
            .text()
            .replace(/\s+/g, ' ')
            .replace(
                '중식(2)1100~1430 외국어로 메뉴를 알기 원하시면 구글앱 hfspn 또는 웹사이트 www.hfspn.co 에서 확인하실 수 있습니다.',
                ''
            )
            .replace('석식1640~1840 기타 식당관련 건의사항은 hfspn 게시판을 이용하시면 됩니다.', '');

        var match;
        while ((match = re.exec(menu))) {
            if (menus != '') {
                menus += '\n\n';
            }
            menus += match[0]
                .replace(' Kcal', 'Kcal')
                .replace(/\s+/g, '\n')
                .replace(/(\d{2})(\d{2}~\d{2})(\d{2})/g, ' $1:$2:$3\n')
                .replace('Kcal', ' Kcal');
        }

        if (menus == '') callback('오늘은 밥 안 나옴');
        else callback(menus);
    });
}

const spellCheck = (hangle, callback) => {
    var toCheck = encodeURIComponent(hangle);
    var url = `https://m.search.naver.com/p/csearch/dcontent/spellchecker.nhn?_callback=window.__jindo2_callback._spellingCheck_0&q=${toCheck}`;

    // Set the headers
    var headers = {
        'User-Agent': 'Super Agent/0.0.1',
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    // Configure the request
    var options = {
        url: url,
        method: 'POST',
        headers: headers
    };

    // Start the request
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            try {
                var temp = body.replace(
                    'window.__jindo2_callback._spellingCheck_0(',
                    ''
                );
                var parsed = JSON.parse(temp.substring(0, temp.length - 2))
                    .message.result;
                var errataCount = parsed.errata_count;
                var checked = parsed.html;
                console.log(checked);
                var result = checked.replace(/<.+?>/g, '');

                if (errataCount === 0) {
                    result = '※ 교정할 내용이 없습니다.';
                }
            } catch (err) {
                result = '오류: 네이버 맞춤법검사기';
                console.log(result);
            }
            callback(result);
            return;
        }
    });
};

const getKoreanWord = (message, callback) => {
    var toSearch = message.substring(0, message.length - 2);
    var word = encodeURIComponent(toSearch);
    var url = `http://suggest-bar.daum.net/suggest?mod=json&code=utf_in_out&enc=utf&id=language&cate=kor&q=${word}&callback=window.suggestInstance.dataModel.forceLoadComplete`;

    request(
        {
            url: url,
            json: true
        },
        function(error, response, body) {
            var meaning = '';
            if (!error && response.statusCode === 200) {
                try {
                    var res = body.replace(
                        '/**/window.suggestInstance.dataModel.forceLoadComplete(',
                        ''
                    );
                    res = JSON.parse(res.substring(0, res.length - 2));
                    meaning = res.items.filter(a =>
                        a.includes('|' + toSearch + '|')
                    )[0];
                } catch (err) {
                    meaning = '오류: 다음 국어사전';
                    console.log(meaning);
                }
            }

            if (meaning) {
                meaning = meaning.replace(/kokk[|].+[|]/, '');
                callback(meaning);
            } else {
                callback('단어를 찾지 못했습니다.');
            }
        }
    );
};

const getWeatherImun = callback => {
    request(
        {
            url: 'http://www.kma.go.kr/wid/queryDFS.jsp?gridx=61&gridy=127'
        },
        function(error, response, body) {
            if (!error && response.statusCode === 200) {
                const xml = body;
                parseString(xml, function(err, result) {
                    const data = result.wid.body[0].data[0];
                    const { hour, sky, temp, wfKor, pop, pty, reh } = data;
                    // console.log(data);

                    const skky = (s => {
                        switch (s) {
                            case '1':
                                return '☀️ ';
                            case '2':
                                return '⛅ ';
                            case '3':
                                return '🌥 ';
                            case '4':
                                return '☁ ';
                            default:
                                return '';
                        }
                    })(sky[0]);

                    const rain = (p => {
                        switch (p) {
                            case '1':
                                return '🌧🌧🌧 비';
                            case '2':
                                return '🌧🌨🌧 비/눈';
                            case '3':
                                return '🌨🌨🌨 눈';
                            default:
                                return skky + wfKor[0];
                        }
                    })(pty[0]);

                    let h = Number(hour[0]);

                    const text = `🌡 온도 : ${temp[0]}ºC
               💧 습도 : ${reh[0]}%
               ${rain}
               강수확률 : ${pop[0]}%`.replace(/   ?/g, '');

               const weather = {
                   title: '이문동 날씨',
                   text
               }

                    callback(weather);
                });
            } else {
                callback({
                    err: true
                })
            }
        }
    );
};


getDailyAppNews = (callback)  => {

    
    client.fetch('https://www.appvillage.or.kr/jsp/apptrend/dayIssueList.jsp', {}, function(err, $, res) {
        if (err) {
            console.log('Error : ', err);
            return;
        }

        const match = $('.ellipsis01').html().match(/javascript:goBoardView\('(\d+)','20'\)/)
        match && ((item) => {
            const url = `https://www.appvillage.or.kr/jsp/apptrend/dayIssueView.jsp?itemNo=${item}`;
            
            var headers = {
                'User-Agent': 'Super Agent/0.0.1',
                'Content-Type': 'application/x-www-form-urlencoded'
            };
            // Configure the request
            const options = {
                url: url,
                method: 'POST',
                headers
            };
            request(options, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    $ = cheerio.load(body);

                    let text = '';
                    links = $('b a'); //jquery get all hyperlinks
                    $(links).each(function(i, link){
                      text += `${$(link).text()}\n${$(link).attr('href')}\n\n`
                    });

                    callback(text.trim());

                }
            })
        })(match[1]);
    })    
}


/*
function getData(callback) {

    var data = [];

    FB.api(
        `/oauth/access_token?client_id=115636262446229&client_secret=e04f3197abb31698c7357cabfaf6c562&grant_type=client_credentials`,
        'GET',
        function(res) {
            console.log(res);
            var access_token = res.access_token;

            FB.api(
                '/digestict',
                'GET',
                {
                    fields: 'feed.limit(2){attachments,created_time}',
                    access_token
                },
                function(res) {
                    res.feed.data.map(d => d.attachments.data.map(dd => 
                     dd.subattachments && dd.subattachments.data.map(ddd => {
                         
                        const imageUrl = ddd.media.image.src


                        const url = `https://wh.jandi.com/connect-api/webhook/13626446/37772e7a1a35f18c2a8c8962fff266c6`;
                        

                        const body = 
                        {
                            "body" : `[[PizzaHouse]](${imageUrl}) You have a new Pizza order.`,
                            "connectColor" : "#FAC11B",
                            "connectInfo" : [{
                            "title" : "Topping",
                            "description" : "Pepperoni"
                            },
                            {
                            "title": "Location",
                            "description": "Empire State Building, 5th Ave, New York",
                            "imageUrl": imageUrl
                            }]
                            }

                    
                        // Configure the request
                        const options = {
                            url: url,
                            method: 'POST',
                            body,
                            json: true
                        };


                        request(options, function(error, response, body) {
                            if (!error && response.statusCode == 200) {
                                console.log(body);
                            }

                        })



                        
                    
                    
                    } )));
                }
            );
        }
    );
}
*/

module.exports = {
    getCafeteriaMenu,
    spellCheck,
    getKoreanWord,
    getWeatherImun,
    getDailyAppNews
};

