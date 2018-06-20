const cheerio = require('cheerio');
const Nightmare = require('nightmare');
const listTagHaveChil = ['th', 'em', 'span', 'td', "p"];
const request = require("request");
const getChildrenElement = (elements, classorid) => {
    let childrenElement = null;
    for (let i = 0; i < elements.length; i++) {
        let e = elements[i];
        if (e.attribs !== undefined) {
            if (e.attribs.class == classorid || e.attribs.id == classorid) {
                return e
                break;
            } else {
                childrenElement = getChildrenElement(e.children || [], classorid);
                if (childrenElement !== null) {
                    return childrenElement
                }
            }

        } else {
            childrenElement = getChildrenElement(e.children || [], classorid);
            if (childrenElement !== null) {
                return childrenElement
            }
        }
    }
    return childrenElement
}
const getListElementByClass = (elements, classorid) => {
    let childrenElement = [];
    for (let i = 0; i < elements.length; i++) {
        let e = elements[i];

        if (e.attribs !== undefined) {
            if (e.attribs.class == classorid || (e.attribs.class || "").indexOf(classorid) !== -1) {

                childrenElement.push(e)

            } else {
                childrenElement = childrenElement.concat(getListElementByClass(e.children || [], classorid));

            }

        } else {
            childrenElement = childrenElement.concat(getListElementByClass(e.children || [], classorid));

        }
    }
    return childrenElement
}
const getListElementByTag = (elements, classorid) => {
    let childrenElement = [];
    for (let i = 0; i < elements.length; i++) {
        let e = elements[i];

        if (e.name !== undefined) {
            if (e.name == classorid) {

                childrenElement.push(e)

            } else {
                childrenElement = childrenElement.concat(getListElementByTag(e.children || [], classorid));

            }

        } else {
            childrenElement = childrenElement.concat(getListElementByTag(e.children || [], classorid));

        }
    }
    return childrenElement
}
const getDataCrawl = (dataParse, element) => {

    try {
        let elementData = element;
        if (dataParse.sub !== undefined) {

            if (Array.isArray(elementData.children)) {
                elementData = getChildrenElement(element.children, dataParse.sub)
            }


        }
        console.log(elementData.attribs)
        for (let k = 0; k < dataParse.parses.length; k++) {
            let checkType = dataParse.parses[k];
            if (checkType == 'children') {
                if (elementData.children !== undefined) {
                    elementData = elementData.children
                }

            } else {
                if (elementData[checkType] !== undefined) {
                    elementData = elementData[checkType]
                }

            }

        }
        let returlValue = "";
        if (dataParse.type == "attribs") {
            returlValue = elementData.attribs[dataParse.value]
        } else {
            if (dataParse.value == 'array') {

                returlValue = getContentArrayElement([elementData]);
            } else {
                returlValue = getContentTag(elementData);
            }

        }
        if (returlValue !== undefined) {
            if (returlValue.indexOf('//') == 0) {
                returlValue = returlValue.split('//')[1]
            }
        }

        return returlValue

    } catch (e) {
        console.log('getDataCrawl err', e)
        return ""
    }
}
const parsePage = ({ queryElement, dataFormat, page }) => {
    console.log('parse page --------------------------------,')
    var object = {};
    for (let key in dataFormat) {
        object[key] = "";
    }
    const $ = cheerio.load(page, {
        withDomLvl1: true,
        normalizeWhitespace: false,
        xmlMode: true,
        decodeEntities: true
    });

    let arrElement = $(queryElement);
    let listData = [];

    for (let i = 0; i < arrElement.length; i++) {
        let element = arrElement[i];
        try {

            let data = { ...object };
            for (let j in data) {
                if (Array.isArray(dataFormat[j])) {
                    let elements = [];
                    if (Array.isArray(dataFormat[j][0].tags)) {
                        for (let i = 0; i < dataFormat[j][0].tags.length; i++) {
                            if (i == 0) {
                                elements = getListElementByTag([element], dataFormat[j][0].tags[i]);
                            } else {
                                elements = getListElementByTag(elements, dataFormat[j][0].tags[i]);
                            }

                        }
                    } else {
                        elements = getListElementByClass([element], dataFormat[j][0].class);
                    }


                    console.log('-elements-------------------------', elements.length)
                    data[j] = [];
                    var objectElement = {};
                    for (let key in dataFormat[j][1]) {
                        objectElement[key] = "";
                    }
                    for (let ij = 0; ij < elements.length; ij++) {
                        let element = elements[ij]
                        let dataElement = { ...objectElement };
                        for (let e in dataElement) {
                            dataElement[e] = getDataCrawl(dataFormat[j][1][e], element)
                        }
                        data[j].push(dataElement)
                    }
                } else {
                    data[j] = getDataCrawl(dataFormat[j], element)
                }

            }
            listData.push(data);
        } catch (e) {
            console.log('parsePage e')
            listData.push(data);

        }

    }

    return listData
}
const getContentArrayElement = (elements) => {
    let value = "";
    for (let i = 0; i < elements.length; i++) {
        let item = elements[i];
        if (Array.isArray(item.children)) {
            value = value + getContentArrayElement(item.children)
        } else {
            value = value + item.data
        }
    }
    return value
}
const getContentTag = (tag) => {
    try {
        if (listTagHaveChil.indexOf(tag.name) !== -1) {
            return tag.children[0].data
        } else {
            return tag.data
        }
    } catch (e) {
        return ""
    }

}
var cookiesGlobal = null;
const getCookies = async ({ queryelement, dataformat, flow, headers }) => {
    console.log('[getCookies]')
    try {
        const nightmare = Nightmare({ show: false });
        console.log('[getCookies]', 'create nightmare', flow.length)
        let html = null;
        if (headers == undefined) {
            headers = {}
        }
        for (let i = 0; i < flow.length; i++) {
            let step = flow[i];
            switch (step.key) {
                case 'goto': html = await nightmare[step.key](step.value, headers); break;
                case 'scrollTo': html = await nightmare[step.key](step.value[0], step.value[1]); break;
                case 'type': html = await nightmare[step.key](step.value[0], step.value[1]); break;
                default: html = await nightmare[step.key](step.value)
            }
        }
        console.log('[getCookies]', 'success init step success')
        let cookies = null;
        cookies = await nightmare.cookies.get();
        console.log('[getCookies]', 'get cookies suess')
        let newKooies = ""
        for (let i = 0; i < cookies.length; i++) {
            let cokie = cookies[i];
            newKooies = newKooies + cokie.name + '=' + cokie.value + '; '
        }
        cookies = newKooies
        console.log('get cookies', cookies)
        //await nightmare.end()
        return cookies
    } catch (e) {
        console.error('[getCookies] e = ', e);
        return null;
    }


}
const crawlWithFolow = async ({ queryelement, dataformat, flow, headers }) => {
    console.log('crawlWithFolow')
    try {
        let show = false;
        if (flow[0].value.indexOf('groups') !== -1) {
            show = true;
        }
        const nightmare = Nightmare({ show: show });
        let html = null;
        if (headers == undefined) {
            headers = {}
        }
        if (cookiesGlobal !== null) {
            headers.cookie = cookiesGlobal
        }
        //console.log('headers------------------------', headers)
        for (let i = 0; i < flow.length; i++) {
            let step = flow[i];
            switch (step.key) {
                case 'goto': html = await nightmare[step.key](step.value, headers); break;
                case 'scrollTo': html = await nightmare[step.key](step.value[0], step.value[1]); break;
                case 'type': html = await nightmare[step.key](step.value[0], step.value[1]); break;
                default: html = await nightmare[step.key](step.value)
            }
        }


        //console.log(html)
        if (flow[0].value.indexOf('groups') !== -1) {
            let cookies = await nightmare.cookies.get();
            console.log('[getCookies]', 'get cookies suess')
            let newKooies = ""
            for (let i = 0; i < cookies.length; i++) {
                let cokie = cookies[i];
                newKooies = newKooies + cokie.name + '=' + cokie.value + '; '
            }
            cookiesGlobal = newKooies
            console.log('get cookiesGlobal', cookiesGlobal);
            html = await nightmare.end().evaluate(() => { return document.documentElement.innerHTML });
            return parsePage({ queryElement: queryelement, dataFormat: dataformat, page: html });
        } else {
            html = await nightmare.end().evaluate(() => { return document.documentElement.innerHTML });
            return parsePage({ queryElement: queryelement, dataFormat: dataformat, page: html });
        }

    } catch (e) {
        console.error('[crawlWithFolow] e ', e);
        return []
    }


}
const getObjecProfile = (link) => {
    try {
        let uidArr = link.link.split('/');
        let uid = uidArr[uidArr.length - 1].split('?')[0];
        let profile = link.link.split('?')[0]
        if (link.link.indexOf('/profile.php') !== -1) {
            uid = link.link.split('=')[1].split('&')[0]
            profile = 'https://facebook.com/' + uid;
        }
        link.uid = uid;
        link.photos = profile + '/photos_all';
        link.link = profile;
        return link
    } catch (e) {
        console.log(e)
        return link
    }
};
const formatDataSave = (profileData) => {
    if (profileData.avatar == "" || profileData.avatar == undefined) {
        profileData.avatar = profileData.images[0].image
    }
    profileData.images = profileData.images.map((imag) => {
        imag.fbPostId = "";
        if (imag.post_link !== undefined && imag.post_link !== "") {
            imag.fbPostId = imag.post_link.split("&set=")[0].split("fbid=")[1] || ""
        }
        return imag
    })
    profileData.username = profileData.uid;
    let imag = profileData.images[0];
    if (imag.post_link !== undefined && imag.post_link !== "") {
        imag = imag.post_link.split("set=")[1];
        if (imag !== undefined) {
            imag = imag.split(".")[1];
            if (imag !== undefined && imag !== "") {
                profileData.uid = imag
            }
        }
    }
    profileData.status = encodeURI(profileData.status);
    return profileData;
}
const getListImageOrUpdate = (newdata, keys, dataUpdate) => {
    let array = {};
    let clonedata = { ...newdata };
    for (let key in newdata) {
        switch (typeof newdata[key]) {
            case 'object': {
                if (Array.isArray(newdata[key])) {

                    if (newdata[key][0] !== undefined && typeof newdata[key][0] == 'object') {
                        //clonedata[key] = [];
                        for (let i = 0; i < newdata[key].length; i++) {
                            let newKeyData = getListImageOrUpdate(newdata[key][i], keys, dataUpdate);
                            clonedata[key][i] = newKeyData.clonedata;
                            array = { ...array, ...newKeyData.array };
                        }
                    } else {
                        // array string ;

                    }
                } else {
                    // check elemet match
                    let newKeyData = getListImageOrUpdate(newdata[key], keys, dataUpdate);
                    clonedata[key] = newKeyData.clonedata;
                    array = { ...array, ...newKeyData.array };
                }
            } break;
            default: {
                if (keys.indexOf(key) !== -1 && newdata[key] !== null && newdata[key] !== "" && newdata[key] !== "undefined") {
                    array[newdata[key]] = "";
                    if (dataUpdate !== undefined) {
                        clonedata[key] = dataUpdate[newdata[key]]
                    }
                }

            }
        }
    }

    return { clonedata, array };
}
const getLastAlidas = (url) => {
    let alidas = "";
    try {

        return alidas;
    } catch (e) {
        return alidas;
    }

}
const convertImage = (url) => {
    return new Promise((resolve, reject) => {
        request(url, (err, response, body) => {
            console.log(response.headers);
            if (!err) {
                request({
                    method: 'POST',
                    uri:'http://35.187.232.56:8008/upload',
                    form:{
                        file:body
                    },
                    headers:{

                    }
                    // multipart: [
                    //     {
                    //       'content-type': 'application/json',
                    //       body: JSON.stringify({foo: 'bar', _attachments: {'message.txt': {follows: true, length: 18, 'content_type': 'text/plain' }}})
                    //     },
                    //     { body: 'I am an attachment' },
                    //     { body: fs.createReadStream('image.png') }
                    //   ]

                }, function (err, resp, body) {
                    if (err) {
                        console.log('Error!', err);
                    } else {
                        console.log('URL body response: ' + body);
                        resolve(body);
                    }
                });
                // var form = req.form();
                // form.append('file', body, {
                //     // filename: getLastAlidas(url),
                //     // contentType: response.headers['content-type']
                // });
            } else {
                console.log("request image err",err)
                resolve(url);
            }
        })

    });
}
const backupImage = (data, keys) => {
   
    let objectLinksImage = getListImageOrUpdate(data, keys).array;
    let arrKey = Object.keys(objectLinksImage);
   
    const pUpload = arrKey.map(url => convertImage(url));
    return Promise.all(pUpload).then(result => {
        for (let key in objectLinksImage) {
            objectLinksImage[key] = result[arrKey.indexOf(key)]
        }
        return objectLinksImage;
    });

};
exports.formatDataSave = formatDataSave;
exports.getObjecProfile = getObjecProfile;
exports.getCookies = getCookies;
exports.crawlWithFolow = crawlWithFolow;
exports.getContentTag = getContentTag;
exports.parsePage = parsePage;
exports.getDataCrawl = getDataCrawl;
exports.getListElementByClass = getListElementByClass;
exports.getChildrenElement = getChildrenElement;
exports.getListImageOrUpdate = getListImageOrUpdate
exports.backupImage = backupImage;