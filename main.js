let speed = 150;

let interval = setInterval(function () {
    pac.update();
},speed);

window.onkeyup = function(e) {
    let key = e.keyCode ? e.keyCode : e.which;

    if (key == 38) {
        pac.changeDir([-1,0]);
    }else if (key == 40) {
        pac.changeDir([1,0]);
    }else if (key == 37) {
        pac.changeDir([0,-1]);
    }else if (key == 39) {
        pac.changeDir([0,1]);
    }
};
