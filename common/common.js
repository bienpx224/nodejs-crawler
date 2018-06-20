var crypto = require('crypto');
var async = require('async');
var request = require('request');
exports.response = function (res, success, data, mes, status) {
    if (status !== undefined) {
        res.status(status);
    }
    if (typeof (success) == 'object') {
        res.json(success);
        return 1;
    }
    res.json({ 'success': success, 'message': mes, 'data': data });
    return 1;
};
exports.getAccessToken = function (req) {
    if (req.query.accessToken !== '' && req.query.accessToken !== undefined && req.query.accessToken !== null) {
        return req.query.accessToken || '';
    }
    try {
        var data = req.cookies.accessToken || '{}';
        var datajson = {};
        if (typeof data == 'string') {
            datajson = JSON.parse(data);
        } else {
            datajson = data;
        }
        return datajson.id || '';
    } catch (e) {
        return '';
    }
};
exports.generateKey = function (hmacKey, algorithm, encoding) {
    hmacKey = hmacKey || 'Application';
    algorithm = algorithm || 'sha1';
    encoding = encoding || 'hex';
    var hmac = crypto.createHmac(algorithm, hmacKey);
    var buf = crypto.randomBytes(32);
    hmac.update(buf);
    var key = hmac.digest(encoding);
    return key;
};
exports.checkUser = function (req, AccessToken) {
    return new Promise(function (resolve, reject) {
        let accesstoken = exports.getAccessToken(req);
        if (accesstoken !== '' && accesstoken !== undefined && accesstoken !== null) {
            AccessToken.findOne({
                where: {
                    id: accesstoken,
                },
                fields: ['userId'],
                include: {
                    relation: 'user',
                    scope: {
                        where: { active: true },
                        include: [{
                            relation: 'usersapp',
                            scope: {
                                include: {
                                    relation: 'app',
                                    scope: {
                                        include: {
                                            relation: 'documents',
                                            scope: {
                                                limit: 5,
                                            },
                                        },
                                    },
                                },
                            },
                        }],
                    },
                },
            }).then(data => {
                if (data == null) {
                    reject('access token expied or user not permistion');
                } else {
                    let user = data.user();
                    let userapps = user.usersapp();
                    let app = null;
                    let appowner = null;
                    for (let i = 0; i < userapps.length; i++) {
                        let userapp = userapps[i];
                        let appdata = userapp.app();
                        if (appdata.owner == user.id) {
                            appowner = appdata;
                        }
                        if (appdata.id == user.appmaster_id) {
                            app = appdata;
                        }
                    }
                    user.app_id = appowner.app_id;
                    user.secret_key = appowner.secret_key;
                    user.appId = appowner.id;
                    user.documents = appowner.documents();
                    user.appObject = appowner;
                    if (app !== null) {
                        user.app_id = app.app_id;
                        user.secret_key = app.secret_key;
                        user.documents = app.documents();
                        user.appId = app.id;
                        user.appObject = app;
                    } else {
                        user.appmaster_id = appowner.id;
                    }
                    resolve(user);
                }
            }).catch(err => {
                console.log('err', err);
                reject(err);
            });
        } else {
            reject('access token expied');
        }
    });
};

exports.getdataTable = function (req, ModelDB) {
    return new Promise((resolve, reject) => {
        var filter = req.body.filter || {};
        var limit = req.body.limit || 10;
        var offset = req.body.offset || 0;
        var skipa = req.body.skip || 0;
        var skip = parseInt(skipa);
        var include = req.body.include || '';
        var order = req.body.order || 'created DESC';
        if (skip == 0) {
            skip = parseInt(limit) * parseInt(offset);
        }
        async.parallel([
            function (callbackTotal) {
                ModelDB.count(filter, function (err, total) {
                    if (!err) {
                        callbackTotal(null, total);
                    } else {
                        callbackTotal(null, 0);
                    }
                });
            },
            function (callbackData) {
                var options = {
                    where: filter,
                    'limit': parseInt(limit),
                    'skip': skip,
                    'order': order,
                };
                if (include !== '') {
                    options['include'] = include;
                }
               

                ModelDB.find(options, function (err, result) {
                    if (!err) {
                        callbackData(null, {
                            'data': result,
                        });
                    } else {
                        console.log('errquery', err);
                        callbackData(null, {
                            'data': [],
                        });
                    }
                });
            },
        ], function (err, results) {
            var nextPage = false;
            if (results[1].data.length === parseInt(limit)) {
                nextPage = true;
            }
            resolve({
                'success': true,
                'message': 'ok',
                'total': results[0],
                'data': results[1].data,
                'nextPage': nextPage,
                'limit': limit,
                'offset': offset,
            });
        });
    });
};

exports.checkApp = (data, server, ApplicationMaster) => {
    return new Promise((resolve, reject) => {
        let keyCache = 'app_' + data.app_id;
        server.cache.getCacheData(keyCache).then(dataCache => {
            if (dataCache !== null) {
                if (dataCache.secret_key == data.secret_key) {
                    resolve(dataCache);
                } else {
                    reject('app id not match');
                }
            } else {
                ApplicationMaster.findOne({ where: data }).then(app => {
                    if (app == null) {
                        reject('app id not match');
                    } else {
                        server.cache.updateCacheData(keyCache, app);
                        resolve(app);
                    }
                }).catch(err => {
                    reject('app id not match,pls check again');
                });
            }
        });
    });
};
exports.checkAppByAppid = (app_id, server, ApplicationMaster) => {
    return new Promise((resolve, reject) => {
        let keyCache = 'app_' + app_id;
        server.cache.getCacheData(keyCache).then(dataCache => {
            if (dataCache !== null) {
                resolve(dataCache);
            } else {
                ApplicationMaster.findOne({ where: { 'app_id': app_id } }).then(app => {
                    if (app == null) {
                        reject('app id not match');
                    } else {
                        server.cache.updateCacheData(keyCache, app);
                        resolve(app);
                    }
                }).catch(err => {
                    reject('app id not match,pls check again');
                });
            }
        });
    });
};

exports.checkDocument = (data, server, Document) => {
    return new Promise((resolve, reject) => {
        let keyCache = data.appId + '_document_' + data.key;
        server.cache.getCacheData(keyCache).then(dataCache => {
            if (dataCache !== null) {
                if (dataCache.appId == data.appId) {
                    resolve(dataCache);
                } else {
                    reject('app id not match');
                }
            } else {
                Document.findOne({ where: data }).then(doc => {
                    if (doc == null) {
                        reject(null);
                    } else {
                        server.cache.updateCacheData(keyCache, doc);
                        resolve(doc);
                    }
                }).catch(err => {
                    reject('app id not match,pls check again');
                });
            }
        });
    });
};
exports.getDocumentByKey = (elasticsearch, config, app_id, key, fields, cbGetData) => {
    elasticsearch.getHits(config.elasticsearch.table.livescoreresult, [{
        'match': {
            'key.keyword': key,
        },
    }, {
        'match': {
            'app_id.keyword': app_id,
        },
    }]).then(hits => {
        if (hits.hits.hits.length == 0) {
            request({
                method: 'GET',
                json: true,
                headers: {
                    'content-type': 'application/json',
                },
                body: {},
                uri: config.sync.domain + '/document?key=' + 'document.' + app_id + '_:_' + key,
            }, (err, response, body) => {
                if (!err && body !== null && body !== '' && typeof body == 'object') {
                    cbGetData(null, body);
                } else {
                    cbGetData(null, {});
                }
            });
        } else {
            cbGetData(null, hits.hits.hits[0]._source);
        }
    }).catch(err => {
        cbGetData(null, err);
    });
};