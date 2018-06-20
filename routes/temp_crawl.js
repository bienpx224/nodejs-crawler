
exports.fb_list_post = function (url) {
    if (url == undefined) {
        url = "https://www.facebook.com/groups/VNsbGroup/"
    }
    let dataReturn = {
        "flow": [{ key: "goto", value: url },
        { key: "type", value: ['#email', "hello.imcuong@yahoo.com"] },
        { key: "type", value: ['#pass', "@Nagato192939d.m.c."] },
        { key: "click", value: '#u_0_2' },
        { key: "click", value: '#loginbutton' },
        { key: "wait", value: "._1dwg._1w_m._q7o" }],
        "queryelement": "._1dwg._1w_m._q7o",
        "dataformat": {
            "name": {
                "type": "data",
                "value": "data",
                "parses": ["children", 0, "children", 0],
                "sub": "fwb fcg"
            },
            "link": {
                "type": "attribs",
                "value": "href",
                "parses": ["children", 1, "children", 0, "children", 0, "children", 0]
            },
            "image": {
                "type": "attribs",
                "value": "src",
                "sub": "_46-i img",
                "parses": []
            },
            status: {
                "type": "data",
                "value": "array",
                "parses": [],
                "sub": "_5pbx userContent _3576"
            }
        }
    };
    return dataReturn;
}
exports.postLink = function () {
    return {
        "headers": headers,
        flow: [{ key: "goto", value: "https://www.facebook.com/photo.php?fbid=2167499883484330&set=g.1173636692750000&type=1&ifg=1" },
        { key: "wait", value: 3000 }, { key: "wait", value: ".clearfix.fbPhotoSnowliftPopup" }],
        queryelement: ".clearfix.fbPhotoSnowliftPopup",
        dataformat: {
            "name": {
                "type": "data",
                "value": "data",
                "parses": ["children", 0],
                "sub": "taggee _hli"
            },
            "link": {
                "type": "attribs",
                "value": "href",
                "parses": [],
                "sub": "taggee _hli"
            },
            "avatar": {
                "type": "attribs",
                "value": "src",
                "parses": [],
                "sub": "spotlight"
            },
            "status": {
                "type": "data",
                "value": "array",
                "parses": [],
                "sub": "hasCaption"
            }
        }
    }
}
exports.wc2018_standings_m7 = function () {
    return {
        "headers": {},
        flow: [{ key: "goto", value: "http://data.7m.com.cn/matches_data/149/vn/index.shtml" },
        { key: "wait", value: "#Groups_Table" }],
        queryelement: "#Groups_Table table:nth-child(2) tbody tr",
        dataformat: {
            "stt": {
                "type": "data",
                "value": "array",
                "parses": ["children", 0]
            },
            "TeamName": {
                "type": "data",
                "value": "array",
                "parses": ["children", 1]
            },
            "TeamLink": {
                "type": "attribs",
                "value": "href",
                "parses": ["children", 1,"children", 0]
            },
            "TeamFlag": {
                "type": "data",
                "value": "array",
                "parses": ["children", 1]
            },
            "Played": {
                "type": "data",
                "value": "array",
                "parses": ["children", 2]
            },
            "Wins": {
                "type": "data",
                "value": "array",
                "parses": ["children", 3]
            },
            "Draws": {
                "type": "data",
                "value": "array",
                "parses": ["children", 4]
            },
            "Losses": {
                "type": "data",
                "value": "array",
                "parses": ["children", 5]
            },
            "GoalsScored": {
                "type": "data",
                "value": "array",
                "parses": ["children", 6]
            },
            "GoalsReceived": {
                "type": "data",
                "value": "array",
                "parses": ["children", 7]
            },
            "GoalDifference": {
                "type": "data",
                "value": "array",
                "parses": ["children", 1]
            },
            "Points": {
                "type": "data",
                "value": "array",
                "parses": ["children", 8]
            },
        }
    }
}
exports.wc2018_standings = function () {
    return {
        "headers": {},
        flow: [
            { key: "goto", value: "http://www.fifa.com/worldcup/groups/" },
            // { key: "wait", value: 5000 },
            { key: "wait", value: ".fi-table.fi-standings" }
        ],
        queryelement: ".fi-table.fi-standings",
        dataformat: {
            "GroupName": {
                "type": "data",
                "value": "data",
                "parses": [],
                "sub": "fi-table__caption__title"
            },
            "Team": [
                {
                    tags: ["tbody", "tr"]
                },
                {
                    "TeamName": {
                        "type": "data",
                        "value": "array",
                        "parses": ["children", 1],
                        "sub": "fi-t__n"
                    },
                    "TeamCode": {
                        "type": "data",
                        "value": "array",
                        "parses": ["children", 3],
                        "sub": "fi-t__n"
                    },
                    "TeamFlag": {
                        "type": "attribs",
                        "value": "src",
                        "parses": ["children", 1],
                        "sub": "fi-t__i "
                    },
                    "Played": {
                        "type": "data",
                        "value": "array",
                        "parses": [],
                        "sub": "fi-table__matchplayed"
                    },
                    "Wins": {
                        "type": "data",
                        "value": "array",
                        "parses": [],
                        "sub": "fi-table__matchplayed"
                    },
                    "Draws": {
                        "type": "data",
                        "value": "array",
                        "parses": [],
                        "sub": "fi-table__draw"
                    },
                    "Losses": {
                        "type": "data",
                        "value": "array",
                        "parses": [],
                        "sub": "fi-table__lost"
                    },
                    "GoalsScored": {
                        "type": "data",
                        "value": "array",
                        "parses": [],
                        "sub": "fi-table__goalfor"
                    },
                    "GoalsReceived": {
                        "type": "data",
                        "value": "array",
                        "parses": [],
                        "sub": "fi-table__goalagainst"
                    },
                    "GoalDifference": {
                        "type": "data",
                        "value": "array",
                        "parses": [],
                        "sub": "fi-table__diffgoal"
                    },
                    "Points": {
                        "type": "data",
                        "value": "array",
                        "parses": [],
                        "sub": "fi-table__pts"
                    },

                }
            ]
        }
    }
}

exports.wc2018_team_detail_m7 = function(url){
    return {
        "headers": {},
        flow: [
            { key: "goto", value: url||"http://team.7msport.com/414/index_vn.shtml" },
            // { key: "wait", value: 5000 },
            { key: "wait", value: ".ltbs1" }
        ],
        queryelement: "body",
        dataformat: {
            "TeamName":{
                "type": "data",
                "value": "data",
                "parses": ["children", 0],
                "sub":"qdtt1"
            },
            "TeamFlag":{
                "type": "attribs",
                "value": "src",
                "parses": [],
                "sub":"logo_img"
            }
        }
    }
}