exports.allocArray = function(width, height) {
    //console.log("Allocating array of " + width + " by " + height)
    var arr = new Array(width);
    for (var i = 0; i < width; i++) {
        arr[i] = new Array(height);
    }
    return arr;
}
