async function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function getId() {
    return new Date().getTime();
}

Array.prototype.remove = function (element) {
    let index = this.indexOf(element);
    this.splice(index, 1);
}