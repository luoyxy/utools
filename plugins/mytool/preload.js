const request = require('request');

const { exec } = require('child_process');
const iconv = require('iconv-lite');




if (!String.format) {
    String.format = function(format) {
        var args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ?
                args[number] :
                match;
        });
    };
}

var weekDesc = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
window.exports = {
    "news": { // 注意：键对应的是 plugin.json 中的 features.code
        mode: "list", // 列表模式
        args: {
            // 进入插件时调用（可选）
            enter: (action, callbackSetList) => {
                // 如果进入插件就要显示列表数据
                request('http://loyal.xyyxr.cn/utools/newslist/newslist', {
                    json: true
                }, (err, res, body) => {
                    if (err) {
                        return console.log(err);
                    }
                    var retList = []
                    for (var index in body) {
                        item = {}
                        item.isnewslist = true
                        item.title = body[index]['desc']
                        item.description = ""
                        item.icon = "./Img/" + body[index]['icon']
                        item.keywords = body[index]['key']
                        retList.push(item)
                    }
                    callbackSetList(retList)
                });
            },

            // 用户选择列表中某个条目时被调用
            select: (action, itemData, callbackSetList) => {
                // window.utools.hideMainWindow()
                // const url = itemData.url
                // require('electron').shell.openExternal(url)
                // window.utools.outPlugin()
                if (itemData.isnewslist) {
                    console.log(itemData.keywords)
                    request('http://loyal.xyyxr.cn/utools/newsinfo/' + itemData.keywords, {
                        json: true
                    }, (err, res, body) => {
                        if (err) {
                            return console.log(err);
                        }
                        var retList = []
                        for (var index in body) {
                            item = {}
                            item.isnewslist = false
                            item.title = body[index]["title"]
                            item.description = body[index]["subtitle"]
                            item.icon = "./Img/" + body[index]["icon"]
                            item.url = body[index]["url"]
                            retList.push(item)
                        }
                        callbackSetList(retList)
                    });
                } else {
                    console.log(itemData.url)
                    require('electron').shell.openExternal(itemData.url)
                    window.utools.hideMainWindow()

                }

            },
            // 子输入框为空时的占位符，默认为字符串"搜索"
            placeholder: "搜索"
        }
    },
    "technology": { // 注意：键对应的是 plugin.json 中的 features.code
        mode: "list", // 列表模式
        args: {
            // 进入插件时调用（可选）
            enter: (action, callbackSetList) => {
                // 如果进入插件就要显示列表数据
                request('http://loyal.xyyxr.cn/utools/newslist/technology', {
                    json: true
                }, (err, res, body) => {
                    if (err) {
                        return console.log(err);
                    }
                    var retList = []
                    for (var index in body) {
                        item = {}
                        item.isnewslist = true
                        item.title = body[index]['desc']
                        item.description = ""
                        item.icon = "./Img/" + body[index]['icon']
                        item.keywords = body[index]['key']
                        retList.push(item)
                    }
                    callbackSetList(retList)
                });
            },

            // 用户选择列表中某个条目时被调用
            select: (action, itemData, callbackSetList) => {
                // window.utools.hideMainWindow()
                // const url = itemData.url
                // require('electron').shell.openExternal(url)
                // window.utools.outPlugin()
                if (itemData.isnewslist) {
                    console.log(itemData.keywords)
                    request('http://loyal.xyyxr.cn/utools/newsinfo/' + itemData.keywords, {
                        json: true
                    }, (err, res, body) => {
                        if (err) {
                            return console.log(err);
                        }
                        var retList = []
                        for (var index in body) {
                            item = {}
                            item.isnewslist = false
                            item.title = body[index]["title"]
                            item.description = body[index]["subtitle"]
                            item.icon = "./Img/" + body[index]["icon"]
                            item.url = body[index]["url"]
                            retList.push(item)
                        }
                        callbackSetList(retList)
                    });
                } else {
                    console.log(itemData.url)
                    require('electron').shell.openExternal(itemData.url)
                    window.utools.hideMainWindow()

                }

            },
            // 子输入框为空时的占位符，默认为字符串"搜索"
            placeholder: "搜索"
        }
    },
    "weather": { // 注意：键对应的是 plugin.json 中的 features.code
        mode: "list", // 列表模式
        args: {
            // 进入插件时调用（可选）
            enter: (action, callbackSetList) => {
                // 如果进入插件就要显示列表数据
                request('http://loyal.xyyxr.cn/utools/weather_now', {
                    json: true
                }, (err, res, body) => {
                    if (err) {
                        return console.log(err);
                    }
                    var retList = []
                    for (var index in body) {
                        var info = body[index]
                        var item = {}
                        item.isFromNow = true
                        item.cityinfo = info['cityid']
                        item.title = String.format("[{0}-{1}] {2} {3}℃ {4}", info['cityadm2'], info['cityname'], info['text'], info['temp'], info['windDir'])
                        item.description = String.format("[{0} {1}更新] 体感温度:{2}℃ 风力等级:{3}级 湿度:{4}% 能见度:{5}公里", weekDesc[info['obsTimeSturt'][6]], info['obsTime'], info['feelsLike'], info['windScale'], info['humidity'], info['vis'])
                        item.icon = ""
                        retList.push(item)
                    }
                    callbackSetList(retList)
                });
            },

            // 用户选择列表中某个条目时被调用
            select: (action, itemData, callbackSetList) => {
                if (itemData.isFromNow) {
                    request(String.format("http://loyal.xyyxr.cn//utools/weather_daily/{0}", itemData.cityinfo), {
                        json: true
                    }, (err, res, body) => {
                        if (err) {
                            return console.log(err);
                        }
                        var retList = []
                        for (var index in body) {
                            var info = body[index]
                            var item = {}
                            item.isFromNow = false
                            item.title = String.format("[{0}-{1} {2}] 白天:{3} 夜间:{4}  {5}℃~{6}℃", info['cityadm2'], info['cityname'], info['fxDate'], info['textDay'], info['textNight'], info['tempMin'], info['tempMax'])
                            item.description = String.format("[{0}] 日出:{1} 日落:{2} 月升:{3} 月落:{4} 风向:{5}/{6} 降水量:{7}毫秒 能见度:{8}公里", weekDesc[info['fxDateSturt'][6]], info['sunrise'], info['sunset'], info['moonrise'], info['moonset'], info['windDirDay'], info['windDirNight'], info['precip'], info['vis'])
                            item.icon = ""
                            retList.push(item)
                        }
                        callbackSetList(retList)
                    });
                }
            },
            // 子输入框内容变化时被调用 可选 (未设置则无搜索)
            search: (action, searchWord, callbackSetList) => {
                request('http://loyal.xyyxr.cn//utools/weather_daily/' + searchWord, {
                    json: true
                }, (err, res, body) => {
                    if (err) {
                        return console.log(err);
                    }
                    var retList = []
                    for (var index in body) {
                        var info = body[index]
                        var item = {}
                        item.isFromNow = false
                        item.title = String.format("[{0}-{1} {2}] 白天:{3} 夜间:{4}  {5}℃~{6}℃", info['cityadm2'], info['cityname'], info['fxDate'], info['textDay'], info['textNight'], info['tempMin'], info['tempMax'])
                        item.description = String.format("[{0}] 日出:{1} 日落:{2} 月升:{3} 月落:{4} 风向:{5}/{6} 降水量:{7}毫秒 能见度:{8}公里", weekDesc[info['fxDateSturt'][6]], info['sunrise'], info['sunset'], info['moonrise'], info['moonset'], info['windDirDay'], info['windDirNight'], info['precip'], info['vis'])
                        item.icon = ""
                        retList.push(item)
                    }
                    callbackSetList(retList)
                });
            },
            // 子输入框为空时的占位符，默认为字符串"搜索"
            placeholder: "搜索"
        }
    },
    "yiyan": { // 注意：键对应的是 plugin.json 中的 features.code
        mode: "list", // 列表模式
        args: {
            // 进入插件时调用（可选）
            enter: (action, callbackSetList) => {
                // 如果进入插件就要显示列表数据
                request('http://loyal.xyyxr.cn/miscfun/yiyanrand', {
                    json: true
                }, (err, res, body) => {
                    if (err) {
                        return console.log(err);
                    }
                    var retList = []
                    var item = {}
                    item.title = body['title']
                    var subtitle = body['from1']
                    if (body['from2'] != "")
                        subtitle = String.format("{0}|{1}", subtitle, body['from2'])
                    item.description = String.format("{0}", subtitle)
                    item.icon = ""
                    retList.push(item)
                    callbackSetList(retList)
                });
            },

            // 用户选择列表中某个条目时被调用
            select: (action, itemData, callbackSetList) => {
                request('http://loyal.xyyxr.cn/miscfun/yiyanrand', {
                    json: true
                }, (err, res, body) => {
                    if (err) {
                        return console.log(err);
                    }
                    var retList = []
                    var item = {}
                    item.title = body['title']
                    var subtitle = body['from1']
                    if (body['from2'] != "")
                        subtitle = String.format("{0}|{1}", subtitle, body['from2'])
                    item.description = String.format("{0}", subtitle)
                    item.icon = ""
                    retList.push(item)
                    exec('clip').stdin.end(iconv.encode(String.format("{0}\r\n{1}", item.title, item.description), 'gbk'));
                    callbackSetList(retList)
                });
            },
            // 子输入框为空时的占位符，默认为字符串"搜索"
            placeholder: "搜索"
        }
    },
    "tangshisongci": { // 注意：键对应的是 plugin.json 中的 features.code
        mode: "doc", // 文档模式
        args: {
            // 索引集合
            // indexes: require('./indexes.json')
            indexes: [{
                    t: '唐诗三百首',
                    d: '唐诗三百首',
                    p: 'doc/tangshi300.html' //页面, 只能是相对路径
                },
                {
                    t: '唐诗宋词精选',
                    d: '唐诗宋词精选',
                    p: 'doc/tangshisongci.html' //页面, 只能是相对路径
                }
            ],
            // 子输入框为空时的占位符，默认为字符串"搜索"
            placeholder: "搜索"
        }
    },
}