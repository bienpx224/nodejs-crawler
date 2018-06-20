const express = require('express');
const router = express.Router();
var fs = require('fs');
var path = require('path');
//import global conffig
const config_global = require('../common/getConfigGlobal').config_global;

//import lib crawl
const Nightmare = require('nightmare');
const cheerio = require('cheerio');
const async = require('async');
const parseCrawl = require('./crawl');
const request = require('request');
var KhongDau = require('khong-dau');
/* GET home page. */
//imso-hide-overflow tb_l GSkImd tb_st
//https://www.google.com.vn/search?lr=lang_vi&q=chelsea&tbm=nws&qdr=d   ; qdr : so ngay, lr ngon ngu , q tu search , start=10 (page2)
// get news :  https://www.google.com.vn/search?lr=lang_vi&q=chelsea&tbm=nws
//get match history : 
//get bang sep hang:
//get thong tin tran dau : 
//base crawl
const crawlData = (body) => {
    return new Promise((resolve, reject) => {
        let url = body.url || 'http://www.studyvn.com/trac-nghiem/user-score?p&page=1'//url crawl email studen

        let waitIdOrClass = body.wait || "#top-users";
        let queryElement = body.queryelement || ".table .user";
        let dataFormat = body.dataformat || {
            profile_link: {
                type: "attribs",
                value: "href",
                parses: ['children', 0]
            }
        };


        let nightmare = Nightmare();
        nightmare
            .goto(url)
            .wait(waitIdOrClass)
            .evaluate(function () {
                return document.querySelector('body')
                    .innerHTML;
            })
            .end()
            .then(page => {
                resolve(parseCrawl.parsePage({ queryElement, dataFormat, page }))

            })
            .catch(error => {
                console.error('Search failed:', error)
                resolve([])

            })
    });
}
router.post('/base/crawl', (req, res, next) => {
    crawlData(req.body).then(data => {
        res.json(data)
    });
});
// let array = [];
// for (let i = 0; i < 966; i++) {
//     array.push(i + 1)
// }
// let ListInfor = [];
// let total=0;
// async.mapSeries(array, function (page_index, cbPage) {
//     crawlData({ url: "http://www.studyvn.com/trac-nghiem/user-score?p&page=" + page_index }).then(data => {
//         async.mapSeries(data, function (profile, cbprofile) {
//             crawlData({
//                 "url": profile.profile_link,
//                 "wait": ".text.form-horizontal",
//                 "queryelement": ".form-control-static",
//                 "dataformat": {
//                     "info": {
//                         "type": "data",
//                         "value": "data",
//                         "parses": ["children", 0]
//                     }
//                 }
//             }).then(dataProfile => {
//                 let dataObject = {
//                     "nickname": dataProfile[0].info,
//                     "email": dataProfile[1].info,
//                     "full_name": dataProfile[2].info,
//                     "bird_day": dataProfile[3].info,
//                     "favorite": dataProfile[5].info
//                 }
//                 console.log('dataObject-----------', dataObject);
//                 if (dataObject.email !== "" && dataObject.email !== undefined) {
//                     ListInfor.push(dataObject)
//                 }
//                 if(ListInfor.length%100==0){

//                 fs.writeFile(path.join(__dirname, "../data/profile") + "/studyvn_" + total + '.json', JSON.stringify(ListInfor), function (err) {
//                     if (err) {
//                         return console.log(err);
//                     }
//                     ListInfor=[];
//                     console.log("The file was saved!");
//                 });
//                 total=total+100
//                 }
//                 cbprofile(null, {})
//             });
//         }, function (errs, result) {
//             cbPage(null, {})
//         });
//     });

// }, function (err, results) {
//     console.log(ListInfor)
// })
const loginFacebook = async ({ email, password, url, queryelement, dataformat, wait, flow }) => {
    const nightmare = Nightmare({ show: true });
    let html = null;
    if (flow == undefined) {
        flow = [{ key: "goto", value: url },
        { key: "type", value: ['#email', email] },
        { key: "type", value: ['#pass', password] },
        { key: "click", value: '#u_0_2' },
        { key: "click", value: '#loginbutton' },
        { key: "wait", value: wait }];
    }


    for (let i = 0; i < flow.length; i++) {
        let step = flow[i];
        switch (step.key) {
            case 'type': html = await nightmare[step.key](step.value[0], step.value[1]); break;
            default: html = await nightmare[step.key](step.value)
        }
    }
    html = await nightmare.end().evaluate(() => { return document.documentElement.innerHTML });

    let user_id = html.match(/"USER_ID":"(\d+)"/)[1];
    let token = html.match(/"token":"(.*?)"/)[1];
    let ajaxpipe_token = html.match(/"ajaxpipe_token":"(.*?)"/)[1];

    let data = {
        user_id,
        token,
        ajaxpipe_token
    };


    let listlink = parseCrawl.parsePage({
        queryElement: queryelement, dataFormat: dataformat, page: html
    });
    return listlink
}
//{ key: "scrollTo", value: [99999, 0] }]
// console.log(parseCrawl.crawlWithFolow({
//     flow: [{ key: "goto", value: "https://www.facebook.com/groups/tuyettinhcocbeatvn" },
//     { key: "type", value: ['#email', "hello.imcuong@yahoo.com"] },
//     { key: "type", value: ['#pass', "@Nagato192939d.m.c."] },
//     { key: "click", value: '#u_0_2' },
//     { key: "click", value: '#loginbutton' },
//     { key: "wait", value: 5000 }, { key: "scrollTo", value: [99999, 0] }, { key: "wait", value: 8000 }],
//     queryelement: "._1dwg._1w_m._q7o",
//     dataformat: {
//         "name": {
//             "type": "data",
//             "value": "data",
//             "parses": ["children", 0, "children", 0],
//             "sub": "fwb fcg"
//         },
//         "linkfb": {
//             "type": "attribs",
//             "value": "href",
//             "parses": ["children", 1, "children", 0, "children", 0, "children", 0]
//         },
//         "image": {
//             "type": "attribs",
//             "value": "src",
//             "sub": "_46-i img",
//             "parses": []
//         }
//     }
// }));
// console.log(parseCrawl.crawlWithFolow({
//     flow: [{ key: "goto", value: "https://www.facebook.com/100014880796500/photos" },
//     { key: "type", value: ['#email', "hello.imcuong@yahoo.com"] },
//     { key: "type", value: ['#pass', "@Nagato192939d.m.c."] },
//     { key: "click", value: '#u_0_2' },
//     { key: "click", value: '#loginbutton' },
//     { key: "wait", value: 2000 }, { key: "goto", value: "https://www.facebook.com/100014880796500/photos" }, { key: "scrollTo", value: [99999, 0] }, { key: "wait", value: 8000 }],
//     queryelement: ".fbPhotoStarGridElement",
//     dataformat: {
//         "image": {
//             "type": "attribs",
//             "value": "data-starred-src",
//             "parses": []
//         }
//     }
// }));
//._2-sx
//#fbPhotoSnowliftAuthorName

const pushToDB = (data) => {
    request({
        method: 'POST',
        json: true,
        headers: {
            'content-type': 'application/json',
        },
        body: data,
        uri: 'http://localhost:8001/crawl/user',
    }, (err, response, body) => {
        if (!err && body !== null && body !== '' && typeof body == 'object') {

        }
    });
}
var names = [];
const pushToBienDB = (data) => {

    if (names.indexOf(data.name) == -1&&data.avatar!==""&&data.avatar!==undefined&&data.avatar!=="undefined" ) {
        console.log(data)
        names.push(data.name);
        let bodyRequest = {
            email: KhongDau(data.name).split(' ').join('_') + "@gmail.com",
            name: data.name,
            password: "123456",
            picture: data.image
        }

        request({
            method: 'POST',
            json: true,
            headers: {

            },
            form: bodyRequest,
            uri: 'http://192.168.59.81:1337/user/register',
        }, (err, response, body) => {
            // console.log('response create user ', err, typeof body)
            if (!err && body !== null && body !== '' && typeof body == 'object') {
                let bodyRequestCreaePost = {
                    userId: body.id,
                    content: data.status,
                    image: data.avatar
                }
                request({
                    method: 'POST',
                    json: true,
                    headers: {

                    },
                    form: bodyRequestCreaePost,
                    uri: 'http://192.168.59.81:1337/post/addPost',
                }, (err, response, body) => {
                    //console.log('response create post ', err, body)
                    if (!err && body !== null && body !== '' && typeof body == 'object') {

                    }
                });
            }
        });
    }

}
const checkUsers = (uid) => {
    return new Promise((resolve, reject) => {
        request({
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json',
            },
            uri: 'http://localhost:8001/crawl/checkuser?uid=' + uid,
        }, (err, response, body) => {
            if (body == '0' || body == 0) {
                setTimeout(() => {
                    resolve(body)
                }, 10000)
            } else {
                resolve(body)
            }

        });
    })

}
router.get('/facebook/crawl/photos', async (req, res, next) => {
    res.json([])
    let url = req.query.url || "https://www.facebook.com/groups/idollivesexygirl/photos/";
    console.log('url requst', url);
    let headers = {

    }

    //, { key: "scrollTo", value: [99999, 0] }, { key: "wait", value: 5000 }, { key: "scrollTo", value: [99999, 0] }, { key: "wait", value: 5000 }
    let listLinks = await parseCrawl.crawlWithFolow({
        "headers": headers,
        flow: [{ key: "goto", value: url },
        { key: "type", value: ['#email', "hello.imcuong@yahoo.com"] },
        { key: "type", value: ['#pass', "@Nagato192939d.m.c."] },
        //  { key: "click", value: '#u_0_2' },
        { key: "click", value: '#loginbutton' },
        { key: "wait", value: 3000 }, { key: "goto", value: url }, { key: "scrollTo", value: [99999, 0] }
            , { key: "wait", value: 5000 }, { key: "scrollTo", value: [99999, 0] }, { key: "wait", value: 5000 }, { key: "scrollTo", value: [99999, 0] }, { key: "wait", value: 5000 }, { key: "scrollTo", value: [99999, 0] }, { key: "wait", value: 5000 }, { key: "scrollTo", value: [99999, 0] }, { key: "wait", value: 5000 }, { key: "scrollTo", value: [99999, 0] }, { key: "wait", value: 5000 }, { key: "scrollTo", value: [99999, 0] }, { key: "wait", value: 5000 }, { key: "scrollTo", value: [99999, 0] }, { key: "wait", value: 5000 }, { key: "scrollTo", value: [99999, 0] }, { key: "wait", value: 5000 }, { key: "scrollTo", value: [99999, 0] }, { key: "wait", value: 5000 }
        ],
        queryelement: ".uiMediaThumb.uiScrollableThumb.uiMediaThumbLarge",
        dataformat: {
            "post_link": {
                "type": "attribs",
                "value": "href",
                "parses": []
            }
        }
    });
    listLinks = listLinks.filter((link) => { return link.post_link !== "" });
    console.log('listLinks------------------------', listLinks)
    var avatars = []
    async.mapSeries(listLinks, (user, cbUser) => {

        console.log(user.post_link);
        if (avatars.indexOf(user.post_link) == -1) {
            avatars.push(user.post_link);
            let dataUsers = parseCrawl.crawlWithFolow({
                "headers": headers,
                flow: [{ key: "goto", value: user.post_link },
                { key: "wait", value: 3000 }, { key: "wait", value: "._4-u2.mbm._4mrt._5jmm._5pat._5v3q._5uun._4-u8" }],
                queryelement: "._4-u2.mbm._4mrt._5jmm._5pat._5v3q._5uun._4-u8",
                dataformat: {
                    "name": {
                        "type": "data",
                        "value": "data",
                        "parses": ["children", 0, "children", 0, "children", 1, "children", 0],
                        "sub": "_14f3 _14f5 _5pbw _5vra"
                    },
                    "link": {
                        "type": "attribs",
                        "value": "href",
                        "parses": ["children", 0, "children", 0, "children", 1],
                        "sub": "_14f3 _14f5 _5pbw _5vra"
                    },
                    "avatar": {
                        "type": "attribs",
                        "value": "src",
                        "parses": [],
                        "sub": "_46-i img"
                    },
                    "status": {
                        "type": "data",
                        "value": "array",
                        "parses": [],
                        "sub": "_5pbx userContent _3576"
                    },
                    "image": {
                        "type": "attribs",
                        "value": "src",
                        "parses": [],
                        "sub": "_s0 _4ooo _5xib _5sq7 _44ma _rw img"
                    }
                }
            }).then(dataUsers => {
                pushToBienDB(JSON.parse(JSON.stringify(dataUsers[0])));
                //console.log(dataUsers);

                // if (dataUsers.length > 0) {
                //     let dataUser = dataUsers[0]
                //     dataUser = parseCrawl.getObjecProfile(dataUser);
                //     console.log(dataUser);
                //     let check = await checkUsers(dataUser.uid);
                //     // let  check=0
                //     if (check !== "1") {
                //         dataUser.images = await parseCrawl.crawlWithFolow({
                //             "headers": headers,
                //             flow: [{ key: "goto", value: dataUser.photos },
                //             { key: "wait", value: 5000 }, { key: "scrollTo", value: [99999, 0] }, { key: "wait", value: 5000 }],
                //             queryelement: ".fbPhotoStarGridElement",
                //             dataformat: {
                //                 "image": {
                //                     "type": "attribs",
                //                     "value": "data-starred-src",
                //                     "parses": []
                //                 },
                //                 "post_link": {
                //                     "type": "attribs",
                //                     "value": "href",
                //                     "parses": [],
                //                     "sub": "uiMediaThumb _6i9 uiMediaThumbMedium"
                //                 }
                //             }
                //         });

                //         if (dataUser.images.length > 0) {
                //             dataUser = parseCrawl.formatDataSave(dataUser)

                //             pushToDB(dataUser);
                //             var dir = path.join(__dirname, "../data/hotimages");
                //             fs.writeFileSync(dir + "/" + dataUser.uid + '.json', JSON.stringify(dataUser));
                //         }
                //     } else {
                //         console.log('user da ton tai')
                //     }


                // }
                cbUser(null, dataUsers)
            }).catch(err => {
                cbUser(null, "")
            });
        } else {
            console.log('lap link')
            cbUser(null, "")
        }


    }, (errs, results) => { });
});
router.post('/crawl', async (req, res) => {
    let flow = req.body.flow || [];
    let queryelement = req.body.queryelement || "";
    let dataformat = req.body.dataformat || {};
    let listLinks = await parseCrawl.crawlWithFolow({
        "flow": flow,
        "queryelement": queryelement,
        "dataformat": dataformat
    });
    res.json(listLinks)

});
const tempCrawl = require('./temp_crawl');
const crawlWcscore = async () => {
    try {
        let testData = await parseCrawl.crawlWithFolow(tempCrawl.wc2018_standings_m7());
        // wc2018_standings
        // testData = testData.map((group) => {
        //     group.Team = group.Team.filter((item) => {
        //         if (item.Played == "") {
        //             return false
        //         }
        //         return true
        //     })
        //     return group
        // });
        //wc2018_standings_m7
        testData = testData.map((item)=>{
            item.GoalDifference = parseInt(item.GoalsScored)-parseInt(item.GoalsReceived);
            item.TeamFlag="";
            if(item.TeamLink!==undefined){
                try{
                    item.TeamLink = "http://team.7msport.com/"+item.TeamLink.split('(')[1].split(")")[0]+"/index_vn.shtml";
                } catch(e){

                }
                
            }
            
            return item
        });
        testData = testData.filter((item) => {
            return item.TeamName !== "Đội bóng"
        });
        let arrTable = testData.filter((item) => {
            return item.stt.indexOf("Bảng") !== -1
        });
        arrTable = arrTable.map((item) => {
            return {
                GroupName: item.stt,
                Team: []
            }
        });
        let currentGroup = null;
        for (let i = 0; i < testData.length; i++) {
            let item = testData[i];
            if (item.stt.indexOf("Bảng") !== -1) {
                if (currentGroup == null) {
                    currentGroup = 0;
                } else {
                    currentGroup = currentGroup + 1
                }
            } else {
                arrTable[currentGroup].Team.push(item);
            }
        }
        console.log(JSON.stringify(arrTable));
        // link team example : http://team.7msport.com/414/index_vn.shtml
    } catch (e) {
        console.log(e)
    }

}
//crawlWcscore();
const crawlWcTeamDetail=async (url)=>{
        try{
            let testData = await parseCrawl.crawlWithFolow(tempCrawl.wc2018_team_detail_m7(url));
            console.log(testData)
            parseCrawl.backupImage({"list":testData},["TeamFlag"]).then(data=>{
                    console.log('-xxx---------------', data)
            })
        }catch(e){
            console.log("crawlWcTeamDetail",e)
        }
} 
crawlWcTeamDetail("http://team.7msport.com/414/index_vn.shtml");
// request({
//     method: 'GET',
//     json: true,
//     headers: {
//         'content-type': 'application/json',
//     },
//     body: {},
//     uri: 'http://localhost:8000/api/facebook/crawl/photos?url=https://www.facebook.com/groups/263510030791508/photos/',
//     //uri: 'http://localhost:8000/api/facebook/crawl/photos?url=https://www.facebook.com/groups/tuyettinhcocbeatvn/photos/',
// }, (err, response, body) => {
//     if (!err && body !== null && body !== '' && typeof body == 'object') {
//         console.log(body)
//     }
// });
// request({
//     method: 'POST',
//     json: true,
//     headers: {

//     },
//     form: {
//         email: 'Nguyễn_Đình_Phong@gmail.com',
//         name: 'Nguyễn Đình Phong',
//         password: "123456"
//     }
//     ,
//     uri: 'http://192.168.59.81:1337/user/register',
// }, (err, response, body) => {
//     console.log(err, body)
//     if (!err && body !== null && body !== '' && typeof body == 'object') {
//         console.log(body)
//     }
// });
module.exports = router;
