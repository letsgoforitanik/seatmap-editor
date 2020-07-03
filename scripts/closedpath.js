export class ClosedPath {

    parentScene; two; path; parentGroup;
    selectionRectangle; rootGroup; psMouseupEventListener;

    isDragged; mouseStartX; mouseStartY; isSelected; dragend; isLocked;

    id; data;

    strokeColor = '#4285f4';
    fillColor = '#4285f454';

    constructor(parentScene) {
        this.id = getId();
        this.parentScene = parentScene;
        this.initialize();
        this.onLoad();
        this.addEventListeners();
    }

    initialize() {
        this.two = this.parentScene.two;
        this.path = this.two.makePath(true);
        this.parentGroup = this.two.makeGroup(this.path);
        this.selectionRectangle = this.two.makeRectangle(0, 0, 0, 0);
        this.rootGroup = this.two.makeGroup(this.parentGroup, this.selectionRectangle);
        this.psMouseupEventListener = e => this.parentScene_onMouseup(e);
    }

    onLoad() {
        this.isLocked = false;
        this.path.noFill().stroke = this.strokeColor;
        this.path.linewidth = 1;
        this.selectionRectangle.noFill().noStroke();
        this.two.update();
    }

    addEventListeners() {
        let srElement = this.selectionRectangle._renderer.elem;
        $(srElement).mousedown(e => this.onMousedown(e));
    }

    addVertex(x, y) {
        let anchor = this.two.makeCircle(x, y, 1);
        anchor.noStroke().fill = this.strokeColor;
        this.parentGroup.add(anchor);

        let vertex = new Two.Vector(x, y);
        vertex.anchor = anchor;
        this.path.vertices.push(vertex);

        this.two.update();
    }

    removeLastAddedVertex() {

        if (this.path.closed) {
            this.path.closed = false;
            this.path.vertices.forEach(v => v.anchor.fill = this.strokeColor);
            this.path.noFill();
        }
        else {
            let vertex = this.path.vertices.pop();
            this.parentGroup.remove(vertex.anchor);
        }

        this.two.update();
    }

    close() {
        this.path.closed = true;
        this.path.fill = this.fillColor;
        this.path.vertices.forEach(v => v.anchor.noFill());
        this.two.update();
    }

    select() {

        this.isSelected = true;

        let bRect = this.parentGroup.getBoundingClientRect();
        let centre = { x: bRect.left + bRect.width / 2, y: bRect.top + bRect.height / 2 };

        this.selectionRectangle.origin.x = centre.x;
        this.selectionRectangle.origin.y = centre.y;
        this.selectionRectangle.width = bRect.width;
        this.selectionRectangle.height = bRect.height;

        this.selectionRectangle.stroke = 'black';
        this.selectionRectangle.fill = '#ffffff00';
        this.two.update();

        let psElement = this.parentScene.svgRenderer;
        psElement.onmousemove = e => this.parentScene_onMousemove(e);
        $(psElement).on('mouseup', this.psMouseupEventListener);

    }

    deselect() {
        this.isSelected = false;

        this.selectionRectangle.origin.x = 0;
        this.selectionRectangle.origin.y = 0;
        this.selectionRectangle.width = 0;
        this.selectionRectangle.height = 0;

        this.selectionRectangle.noFill().noStroke();
        this.two.update();

        let psElement = this.parentScene.svgRenderer;
        $(psElement).off('mouseup', this.psMouseupEventListener);
    }

    onMousedown(e) {

        if (!this.isSelected) return;

        this.isDragged = true;
        this.parentScene.parent.parent.panZoomController.pause();

        let scaleFactor = new DOMMatrix(this.parentScene.parent.parent.root.style.transform).a;
        let svgRect = this.parentScene.svgRenderer.getBoundingClientRect();

        this.mouseStartX = (e.clientX - svgRect.x) / scaleFactor;
        this.mouseStartY = (e.clientY - svgRect.y) / scaleFactor;

    }

    parentScene_onMousemove(e) {

        if (this.isLocked) return;

        if (this.isDragged) {

            let scaleFactor = new DOMMatrix(this.parentScene.parent.parent.root.style.transform).a;
            let svgRect = this.parentScene.svgRenderer.getBoundingClientRect();

            let mouseEndX = (e.clientX - svgRect.x) / scaleFactor;
            let mouseEndY = (e.clientY - svgRect.y) / scaleFactor;

            let dx = mouseEndX - this.mouseStartX;
            let dy = mouseEndY - this.mouseStartY;

            this.mouseStartX = mouseEndX;
            this.mouseStartY = mouseEndY;

            this.selectionRectangle.origin.addSelf(dx, dy);
            this.selectionRectangle.width += 0;
            this.selectionRectangle.height += 0;

            for (let v of this.path.vertices) {
                v.addSelf(dx, dy);
                v.anchor.position.addSelf(dx, dy);
            }

            this.two.update();
            this.parentScene.parent.parent.panZoomController.resume();

        }

    }

    parentScene_onMouseup(e) {
        if (this.isDragged) {
            this.isDragged = false;
            this.dragend && this.dragend();
            this.parentScene.parent.parent.panZoomController.resume();
        }
    }

    set onClick(f) {
        let pgElement = this.parentGroup._renderer.elem;
        $(pgElement).click(e => f(this, e));
    }

    set onDblclick(f) {
        let srElement = this.selectionRectangle._renderer.elem;
        $(srElement).dblclick(e => f(this, e));
    }

    set onDragend(f) {
        this.dragend = f;
    }

    set onRightClick(f) {
        let srElement = this.selectionRectangle._renderer.elem;
        srElement.oncontextmenu = e => f(this, e);
    }

    get isClosed() {
        return this.path.closed;
    }

    remove() {
        this.rootGroup.remove();
        this.two.update();
    }

    lock() {
        this.isLocked = true;
    }

    unlock() {
        this.isLocked = false;
    }

    clone() {
        let copy = new ClosedPath(this.parentScene);
        this.path.vertices.forEach(v => copy.addVertex(v.x + 50, v.y + 50));
        this.path.closed && copy.close();
        copy.data = this.data;
        return copy;
    }

    getState() {

        return {
            id: this.id,
            vertices: this.path.vertices.map(v => [v.x, v.y]),
            closed: this.path.closed,
            locked: this.isLocked,
            data: this.data
        };
    }

    moveBy(dx, dy) {

        if (this.isLocked) return;

        this.selectionRectangle.origin.addSelf(dx, dy);
        this.selectionRectangle.width += 0;
        this.selectionRectangle.height += 0;

        for (let v of this.path.vertices) {
            v.addSelf(dx, dy);
            v.anchor.position.addSelf(dx, dy);
        }

        this.two.update();
    }

    set fill(v) {
        this.path.fill = v;
    }

    get fill() {
        return this.path.fill;
    }

    set stroke(v) {
        this.path.stroke = v;
    }

    get stroke() {
        return this.path.stroke;
    }

    set onMousemove(f) {
        let pgElement = this.parentGroup._renderer.elem;
        $(pgElement).mousemove(e => f(this, e));
    }

}