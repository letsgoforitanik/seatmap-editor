export class InfoMenu {

    root; head; body; foot;

    hSeatType; hZoneType; hDotType;
    bSeatType; bZoneType; bDotType;

    sTitle; sRowNo; sZoneNo; sDescription; sBookable; sReserved;
    sPrice; sCause; sItemBookable; sItemReserved;

    zTitle; zDescription; zCapacity; zBookable; zReserved; zPrice;

    btnSave; mLock; mClone; mRemove; openerType;

    workingOn; onCloningPath; scene;

    isDragged; xOffset; yOffset;

    constructor(scene) {
        this.scene = scene;
        this.initialize();
        this.addListeners();
        this.onStart();
    }

    initialize() {

        this.root = document.querySelector('#divInfoMenu');
        this.smWrapper = document.querySelector('#page-content-wrapper');

        this.head = this.root.querySelector('div.head');
        this.body = this.root.querySelector('div.body');
        this.foot = this.root.querySelector('div.foot');

        this.hSeatType = this.head.querySelector('div.h-seat-type');
        this.hZoneType = this.head.querySelector('div.h-zone-type');
        this.hDotType = this.head.querySelector('div.h-dot-type');

        this.bSeatType = this.body.querySelector('div.seat-type');
        this.bZoneType = this.body.querySelector('div.zone-type');
        this.bDotType = this.body.querySelector('div.dot-type');
        this.btnSave = this.body.querySelector('#btnSave');

        this.sTitle = this.bSeatType.querySelector('.title');
        this.sRowNo = this.bSeatType.querySelector('.rowno');
        this.sZoneNo = this.bSeatType.querySelector('.zoneno');
        this.sDescription = this.bSeatType.querySelector('.description');
        this.sBookable = this.bSeatType.querySelector('.bookable');
        this.sReserved = this.bSeatType.querySelector('.reserved');
        this.sPrice = this.bSeatType.querySelector('select.price');
        this.sCause = this.bSeatType.querySelector('input.cause');
        this.sItemBookable = this.bSeatType.querySelector('div.item.price');
        this.sItemReserved = this.bSeatType.querySelector('div.item.cause');

        this.zTitle = this.bZoneType.querySelector('.title');
        this.zDescription = this.bZoneType.querySelector('.description');
        this.zCapacity = this.bZoneType.querySelector('.capacity');
        this.zBookable = this.bZoneType.querySelector('.bookable');
        this.zReserved = this.bZoneType.querySelector('.reserved');
        this.zPrice = this.bZoneType.querySelector('select.price');

        this.mLock = this.foot.querySelector('.lock');
        this.mClone = this.foot.querySelector('.clone');
        this.mRemove = this.foot.querySelector('.remove');

    }

    addListeners() {
        $([this.hDotType, this.hSeatType, this.hZoneType]).click(s => this.hItem_Click(s.currentTarget));
        $(this.mLock).click(() => this.mLock_Click());
        $(this.mRemove).click(() => this.mRemove_Click());
        $(this.mClone).click(() => this.mClone_Click());
        $(this.sBookable).click(() => this.sBookable_Click());
        $(this.sReserved).click(() => this.sReserved_Click());
        $(this.zBookable).focusout(() => this.zBookable_Focusout());
        $(this.btnSave).click(() => this.btnSubmit_Click());
        $(this.root).mousedown(e => this.onMousedown(e));
        $(this.root.parentElement).mousemove(e => this.parent_Mousemove(e));
        $(this.root.parentElement).mouseup(e => this.parent_Mouseup(e));
    }

    onStart() {
        this.hDotType.for = this.bDotType;
        this.hZoneType.for = this.bZoneType;
        this.hSeatType.for = this.bSeatType;

        this.hSeatType.type = 'seat';
        this.hZoneType.type = 'zone';
        this.hDotType.type = 'dot';

        $([this.sPrice, this.zPrice]).selectpicker();
    }

    show(x, y) {

        let data = this.workingOn.data;

        if (!data) {
            this.sTitle.value = '';
            this.sRowNo.value = '';
            this.sZoneNo.value = '';
            this.sDescription.value = '';
            this.sBookable.checked = true;
            $(this.sBookable).trigger('click');
            $(this.sPrice).selectpicker('refresh');
            $(this.hSeatType).trigger('click');
        }
        else {
            switch (data.type) {

                case 'seat':
                    this.sTitle.value = data.title;
                    this.sRowNo.value = data.rowNo;
                    this.sZoneNo.value = data.zoneNo;
                    this.sDescription.value = data.description;

                    if (data.bookable) {
                        this.sBookable.checked = true;
                        $(this.sBookable).trigger('click');
                        this.sPrice.value = data.price;
                        $(this.sPrice).selectpicker('refresh');
                    }
                    else {
                        this.sReserved.checked = true;
                        $(this.sReserved).trigger('click');
                        this.sCause.value = data.cause;
                    }

                    $(this.hSeatType).trigger('click');
                    break;

                case 'zone':
                    this.zTitle.value = data.title;
                    this.zDescription.value = data.description;
                    this.zCapacity.value = data.capacity;
                    this.zBookable.value = data.bookable;
                    this.zReserved.value = data.reserved;
                    this.zPrice.value = data.price;

                    $(this.zPrice).selectpicker('refresh');
                    $(this.hZoneType).trigger('click');
                    break;

                case 'dot':
                    $(this.hDotType).trigger('click');
                    break;
            }
        }


        if (this.workingOn.isLocked) this.mLock.innerText = 'Unlock';
        else this.mLock.innerText = 'Lock';

        $(this.root).css({ left: x, top: y }).show();
    }

    hItem_Click(sender) {
        [this.hDotType, this.hSeatType, this.hZoneType].forEach(e => { $(e).css({ background: 'none', borderTop: 'none' }); $(e.for).hide(); });
        sender.style.background = 'white';
        sender.style.borderTop = '1px solid #0175f1';
        this.openerType = sender.type;
        $(sender.for).show();
    }

    mLock_Click() {
        this.workingOn.isLocked ? this.workingOn.unlock() : this.workingOn.lock();
        this.hide();
    }

    mRemove_Click() {
        this.scene.removeCurrentlySelected();
        this.hide();
    }

    mClone_Click() {
        let copy = this.workingOn.clone();
        this.onCloningPath(copy);
        this.hide();
    }

    hide() {
        $(this.root).hide();
    }

    sBookable_Click() {
        if (this.sBookable.checked) {
            $(this.sItemReserved).hide();
            this.sPrice.value = null;
            $(this.sPrice).selectpicker('refresh');
            $(this.sItemBookable).show();
        }
    }

    sReserved_Click() {
        if (this.sReserved.checked) {
            $(this.sItemBookable).hide();
            this.sReserved.value = '';
            $(this.sItemReserved).show();
        }
    }

    btnSubmit_Click() {

        let data = { type: this.openerType };

        switch (this.openerType) {

            case 'seat':
                data.title = this.sTitle.value;
                data.rowNo = this.sRowNo.value;
                data.zoneNo = this.sZoneNo.value;
                data.description = this.sDescription.value;
                data.bookable = this.sBookable.checked;
                if (data.bookable) data.price = this.sPrice.value;
                else data.cause = this.sCause.value;
                break;

            case 'zone':
                data.title = this.zTitle.value;
                data.description = this.zDescription.value;
                data.capacity = this.zCapacity.value;
                data.bookable = this.zBookable.value;
                data.reserved = this.zReserved.value;
                data.price = this.zPrice.value;
                break;

            case 'dot':
                break;

        }

        this.workingOn.data = data;
        this.hide();
    }

    zBookable_Focusout() {

        let capacity = this.zCapacity.value;
        let bookable = this.zBookable.value;

        if (!isNaN(capacity) && !isNaN(bookable)) {
            let reserved = capacity - bookable;
            if (reserved >= 0) this.zReserved.value = reserved;
        }

    }

    onMousedown(e) {
        this.isDragged = true;
        let pRect = this.root.getBoundingClientRect();
        this.xOffset = e.clientX - pRect.x;
        this.yOffset = e.clientY - pRect.y;
    }

    parent_Mousemove(e) {
        if (!this.isDragged) return;
        $(this.root).css({ left: e.clientX - this.xOffset, top: e.clientY - this.yOffset, cursor: 'all-scroll' });
    }

    parent_Mouseup() {
        this.isDragged = false;
        this.root.style.removeProperty('cursor');
    }

    loadPriceInfo(info) {

        let innerHTML = '';

        for (let i of info) innerHTML += `<option data-content="<div class='price-item'><span class='color-code' style='background:${i.colorCode};'></span><span class='name'>${i.name}</span><span class='price'>${i.price}</span></div>">${i.price}</option>`;

        this.sPrice.innerHTML = innerHTML;
        this.zPrice.innerHTML = innerHTML;

        $([this.sPrice, this.zPrice]).selectpicker('refresh');

    }


}