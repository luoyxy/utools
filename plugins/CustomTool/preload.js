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

var initCallBack = null
utools.onPluginReady(() => {
    console.log('插件装配完成，已准备好')
})


utools.onPluginEnter(({
    code,
    type,
    payload
}) => {
    console.log('用户进入插件', code, type, payload)
    initCallBack(code)
})

window.SetInitCallBack = function(callback) {
    initCallBack = callback
}