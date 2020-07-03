import { ClosedPath } from './closedpath.js';
import { InfoMenu } from './infomenu.js';


export class Scene {

    parent; two; paths;
    svgRenderer; currentlyDrawn; currentlySelected; dragCompleted;
    infoMenu; isInCustomerViewMode; tooltip; timeoutId;

    onSelectionClick;

    constructor(parent) {
        this.parent = parent;
        this.initialize();
        this.addEventListeners();
    }

    initialize() {
        this.two = new Two().appendTo(this.parent.root);
        this.svgRenderer = this.two.renderer.domElement;
        this.paths = [];
        this.infoMenu = new InfoMenu(this);
    }

    addEventListeners() {
        $(this.svgRenderer).mousedown(e => this.onMousedown(e));
        $(this.svgRenderer).mouseup(e => this.onMouseup(e));
        $(this.svgRenderer).contextmenu(e => false);
        $(this.svgRenderer).click(e => this.onClick(e));
        this.infoMenu.onCloningPath = sender => this.infoMenu_CloningPath(sender);
    }

    onMousedown(e) {

        if (this.currentlyDrawn) {

            if (e.button == 0) {
                let svgRect = this.svgRenderer.getBoundingClientRect();
                let scaleFactor = new DOMMatrix(this.parent.parent.root.style.transform).a;

                let xSvg = (e.clientX - svgRect.left) / scaleFactor;
                let ySvg = (e.clientY - svgRect.top) / scaleFactor;

                this.currentlyDrawn.addVertex(xSvg, ySvg);
            }
            else {
                this.currentlyDrawn.close();
                this.currentlyDrawn = null;
                this.inDefaultMode();
            }

            return;
        }

        this.inDraggedMode();

    }

    onMouseup(e) {
        !this.currentlyDrawn && this.inDefaultMode();
    }

    startDrawingClosedPath() {

        if (this.currentlyDrawn) {
            this.currentlyDrawn = null;
            this.inDefaultMode();
        }
        else {
            this.currentlyDrawn = new ClosedPath(this);
            this.executeInitialTasks(this.currentlyDrawn);
            this.inDrawingMode();
        }
    }

    executeInitialTasks(path) {
        this.paths.push(path);
        path.onClick = (s, e) => this.currentlyDrawn_Click(s, e);
        path.onDblclick = (s, e) => this.currentlyDrawn_Dblclick(s, e);
        path.onDragend = () => this.currentlyDrawn_Dragend();
        path.onRightClick = (s, e) => this.currentlyDrawn_RightClick(s, e);
    }

    setDimension(width, height) {
        this.two.width = width;
        this.two.height = height;
        this.two.update();
    }

    undoLatestAction() {
        if (this.currentlyDrawn) {
            this.currentlyDrawn.removeLastAddedVertex();
        }
    }

    removeCurrentlySelected() {
        this.paths.remove(this.currentlySelected);
        this.currentlySelected.remove();
        this.currentlySelected = null;
    }

    moveCurrentlySelected(dx, dy) {
        this.currentlySelected && this.currentlySelected.moveBy(dx, dy);
    }

    leaveDrawingMode() {
        this.currentlyDrawn = null;
        this.inDefaultMode();
    }

    currentlyDrawn_RightClick(sender, e) {

        if (this.isInCustomerViewMode) return;

        if (sender.isClosed && sender.isSelected) {
            this.infoMenu.workingOn = sender;
            this.infoMenu.show(e.clientX, e.clientY);
        }
    }

    currentlyDrawn_Click(sender, e) {

        if (this.isInCustomerViewMode) {
            let elem = sender.parentGroup._renderer.elem;
            let data = sender.data;
            this.onSelectionClick(elem, data, sender.id);
        }
        else if (!this.currentlyDrawn) {
            this.currentlySelected && this.currentlySelected.deselect();
            this.currentlySelected = sender;
            this.currentlySelected.select();
        }

        e.stopPropagation();
    }

    currentlyDrawn_Dblclick(sender, e) {

        if (this.isInCustomerViewMode) return;

        if (sender == this.currentlySelected) {
            this.currentlySelected = null;
            this.currentlyDrawn = sender;
            this.currentlyDrawn.deselect();
            this.inDrawingMode();
        }

        e.stopPropagation();

    }

    currentlyDrawn_Dragend() {
        this.dragCompleted = true;
    }

    onClick() {

        if (this.dragCompleted) {
            this.dragCompleted = false;
            return;
        }

        this.currentlySelected && this.currentlySelected.deselect();
        this.currentlySelected = null;
        this.infoMenu.hide();

    }

    inDrawingMode() {
        this.svgRenderer.style.cursor = 'url(images/pen-cursor.ico) 4 4, crosshair';
    }

    inDefaultMode() {
        this.svgRenderer.style.cursor = 'grab';
    }

    inDraggedMode() {
        this.svgRenderer.style.cursor = 'grabbing';
    }

    infoMenu_CloningPath(sender) {
        this.executeInitialTasks(sender);
    }

    getState() {
        return this.paths.map(p => p.getState());
    }

    loadState(info) {
        for (let i of info) {
            let path = new ClosedPath(this);
            this.executeInitialTasks(path);
            i.vertices.forEach(v => path.addVertex(v[0], v[1]));
            path.data = i.data; path.id = i.id;
            i.closed && path.close();
            i.locked && path.lock();
        }
    }

    setCustomerViewMode(info) {

        this.tooltip = document.querySelector('#tooltip');

        let dictPriceColors = {};

        info.forEach(i => dictPriceColors[i.price] = i.colorCode);

        for (let p of this.paths) {

            if (p.data) {

                let d = p.data;

                if (d.type == 'seat') {
                    if (d.bookable == true && !isNaN(d.price)) {
                        let colorCode = dictPriceColors[d.price];
                        p.stroke = p.fill = colorCode; p.booked = false;
                        this.prepareForTooltip(p);
                        continue;
                    }
                    else if (d.bookable == false) {
                        p.stroke = p.fill = 'black';
                        this.prepareForTooltip(p);
                        continue;
                    }
                }
                else if (d.type == 'zone') {
                    if (+d.bookable > 0) {
                        let colorCode = dictPriceColors[d.price];
                        p.stroke = p.fill = colorCode; p.booked = 0;
                        this.prepareForTooltip(p);
                        continue;
                    }
                    else if (+d.bookable === 0) {
                        p.stroke = p.fill = 'black';
                        this.prepareForTooltip(p);
                        continue;
                    }
                }

            }

            p.stroke = p.fill = 'none';
        }

        this.isInCustomerViewMode = true;
        this.two.update();

    }

    prepareForTooltip(path) {

        path.onMousemove = (s, e) => {

            if (this.tooltip.style.display != 'block' || this.tooltip.openedBy != s) {

                let d = s.data;

                let innerHtml = '';

                if (d.type == 'seat') {

                    innerHtml = `Title : ${d.title}<br>
                                 Row : ${d.rowNo}<br>
                                 Zone : ${d.zoneNo}<br>
                                 Desc : ${d.description}<br>`;

                    if (s.booked) innerHtml += `Status : Booked<br>`;
                    else if (d.bookable) innerHtml += `Status : Available<br>`;
                    else innerHtml += `Status : Reserved<br>`;

                    if (!s.booked && d.bookable) innerHtml += `Price : ${d.price}`;

                }
                else {
                    innerHtml = `Title : ${d.title}<br>
                                 Capacity : ${d.capacity}<br>
                                 Available : ${+d.capacity - (+d.reserved + +path.booked)}<br>
                                 Price : ${d.price}`;
                }

                this.tooltip.openedBy = s;
                this.tooltip.innerHTML = innerHtml;

                let bRect = s.path._renderer.elem.getBoundingClientRect();
                $(this.tooltip).css({ top: bRect.top + bRect.height / 2, left: bRect.left + bRect.width / 2 }).show();

                this.timeoutId && clearTimeout(this.timeoutId);
                this.timeoutId = setTimeout(() => $(this.tooltip).hide(), 3000);

            }
        };
    }

    loadBookingData(bookingData) {

        /* bookingData = {
             seats: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }],
             zones: [{ id: 1, booked: 5 }, { id: 3, booked: 7 }]
         };
 
         for (let s of bookingData.seats) {
             let path = this.paths.filter(p => p.id == s.id)[0];
             path && (path.booked = true);
         }
 
         for (let z of bookingData.zones) {
             let path = this.paths.filter(p => p.id == z.id)[0];
             path && (path.booked = z.booked);
         }*/

    }

}