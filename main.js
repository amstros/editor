
function get_mouse_pos(canvas, evt) {
    var rect = canvas.getBoundingClientRect(), // abs. size of element
        scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for x
        scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for y

    return {
        x: (evt.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
        y: (evt.clientY - rect.top) * scaleY     // been adjusted to be relative to element
    }
}

function generate_id(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

function distance(x1, y1, x2, y2) {
    let a = x2 - x1
    let b = y2 - y1
    return Math.sqrt(a * a + b * b)
}

function try_resize_clipping(element, list) {
    list.forEach(item => {
        if (item != element) {
            if (Math.abs(item.x1 - element.x1) < 5)
                element.x1 = item.x1
            if (Math.abs(item.x1 - element.x2) < 5)
                element.x2 = item.x1
            if (Math.abs(item.x2 - element.x1) < 5)
                element.x1 = item.x2
            if (Math.abs(item.x2 - element.x2) < 5)
                element.x2 = item.x2

            if (Math.abs(item.y1 - element.y1) < 5)
                element.y1 = item.y1
            if (Math.abs(item.y1 - element.y2) < 5)
                element.y2 = item.y1
            if (Math.abs(item.y2 - element.y1) < 5)
                element.y1 = item.y2
            if (Math.abs(item.y2 - element.y2) < 5)
                element.y2 = item.y2
        }
    })
}

function try_drag_clipping(element, mouse, list) {
    list.forEach(item => {
        if (element != item) {

        }
    })
}

class Screen {
    constructor(id) {
        this.width = 500
        this.height = 800
        this.container = document.getElementById(id)
        this.canvas = this.new_canvas()
        this.content = []
        this.container.appendChild(this.canvas)
    }

    new_canvas() {
        let canvas = document.createElement('canvas')
        canvas.width = this.width
        canvas.height = this.height
        canvas.style.backgroundColor = "white"
        canvas.addEventListener("contextmenu", (e) => { e.preventDefault() }, false)
        return canvas
    }

    reset_canvas() {
        this.container.removeChild(this.canvas)
        this.canvas = this.new_canvas()
        this.container.appendChild(this.canvas)

    }

    draw_zone(start, stop, color) {

        this.draw_content()

        let ctx = this.canvas.getContext('2d')
        ctx.beginPath()
        ctx.rect(start[0], start[1], stop[0] - start[0], stop[1] - start[1])
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.stroke()
    }

    draw_content() {
        let ctx = this.canvas.getContext('2d')
        ctx.beginPath()
        ctx.clearRect(0, 0, this.width, this.height)

        this.content.forEach(elem => {
            elem.draw(this.canvas)
        })

    }

    sort_content() {
        this.content.sort(((a, b) => {
            let size1 = a.height() * a.width()
            let size2 = b.height() * b.width()

            return (size1 - size2)

        }))
    }

    add_element_mode() {
        this.reset_canvas()
        this.draw_content()

        var clicked = false
        var start, stop = []

        this.canvas.addEventListener("mousemove", (event) => {
            let mouse = get_mouse_pos(this.canvas, event)
            stop = [mouse.x, mouse.y]

            if (clicked)
                this.draw_zone(start, stop, 'black')

        })

        this.canvas.addEventListener('mousedown', (event) => {
            clicked = true
            let mouse = get_mouse_pos(this.canvas, event)
            start = [mouse.x, mouse.y]

        })

        this.canvas.addEventListener('mouseup', (event) => {
            clicked = false
            let element = new Element(generate_id(10), start[0], start[1], stop[0], stop[1])
            this.content.push(element)

            this.sort_content()
            this.selection_mode()
        })
    }

    selection_mode() {
        this.reset_canvas()
        this.draw_content()

        let hovered = undefined

        this.canvas.addEventListener("mousemove", (event) => {
            let mouse = get_mouse_pos(this.canvas, event)
            this.draw_content()

            let found = false
            this.content.forEach(element => {
                if (element.is_frame_at(mouse.x, mouse.y) && !found) {
                    element.draw_hovered(this.canvas)
                    hovered = element
                    found = true
                }
            })
        })

        this.canvas.addEventListener("mousedown", (event) => {
            if (hovered != undefined) {
                this.edit_mode(hovered)
            } else {
                let found = false
                let mouse = get_mouse_pos(this.canvas, event)

                this.content.forEach(element => {
                    if (element.is_frame_at(mouse.x, mouse.y) && !found) {
                        element.draw_hovered(this.canvas)
                        hovered = element
                        found = true
                    }
                    if (found) {
                        this.edit_mode(hovered)
                    }
                })
            }
        })

    }

    edit_mode(element) {
        this.reset_canvas()
        this.draw_content()

        element.draw_selected(this.canvas)
        {
            let mouse = get_mouse_pos(this.canvas, event)
            element.get_interaction(mouse, this.canvas)
        }


        var click_origin = undefined
        var action = undefined

        this.canvas.addEventListener("mousemove", (event) => {
            let mouse = get_mouse_pos(this.canvas, event)
            //dragging
            if (action != undefined) {
                action(mouse, this.content, click_origin)
                click_origin = mouse
                this.draw_content()
                element.draw_selected(this.canvas)
            }
            //hover
            else {
                element.get_interaction(mouse, this.canvas)
            }



        })

        this.canvas.addEventListener("mousedown", (event) => {
            //click
            click_origin = get_mouse_pos(this.canvas, event)
            action = element.get_interaction(click_origin, this.canvas)

            if (action == undefined) {
                this.selection_mode()
            }

        })

        this.canvas.addEventListener("mouseup", (event) => {
            click_origin = undefined
            action = undefined
            this.sort_content()
        })
    }
}


class Element {
    constructor(id, x1, y1, x2, y2) {

        this.id = id
        if (x1 < x2) {
            this.x1 = x1
            this.x2 = x2
        } else {
            this.x1 = x2
            this.x2 = x1
        }

        if (y1 < y2) {
            this.y1 = y1
            this.y2 = y2
        } else {
            this.y1 = y1
            this.y2 = y2
        }

    }


    is_frame_at(x, y) {
        let res = true
        res = res && (x > this.top() && x < this.top() + this.height())
        res = res && (y > this.left() && y < this.left() + this.width())
        return res
    }

    is_top_edge_at(x, y) {
        return (Math.abs(this.y1 - y) <= 6 && this.x1 < x && this.x2 > x)
    }
    is_right_edge_at(x, y) {
        return (Math.abs(this.x2 - x) <= 6 && this.y1 < y && this.y2 > y)
    }
    is_bottom_edge_at(x, y) {
        return (Math.abs(this.y2 - y) <= 6 && this.x1 < x && this.x2 > x)
    }
    is_left_edge_at(x, y) {
        return (Math.abs(this.x1 - x) <= 6 && this.y1 < y && this.y2 > y)
    }
    is_top_left_corner_at(x, y) {
        return (distance(x, y, this.x1, this.y1) <= 6)
    }
    is_top_right_corner_at(x, y) {
        return (distance(x, y, this.x2, this.y1) <= 6)
    }
    is_bottom_left_corner_at(x, y) {
        return (distance(x, y, this.x1, this.y2) <= 6)
    } this
    is_bottom_right_corner_at(x, y) {
        return (distance(x, y, this.x2, this.y2) <= 6)
    }

    // get coordinates
    top() {
        let top
        (this.x1 < this.x2) ? top = this.x1 : top = this.x2
        return top
    }
    left() {
        let left
        (this.y1 < this.y2) ? left = this.y1 : left = this.y2
        return left
    }
    height() {
        let height
        (this.x1 < this.x2) ? height = this.x2 - this.x1 : height = this.x1 - this.x2
        return height
    }
    width() {
        let width
        (this.y1 < this.y2) ? width = this.y2 - this.y1 : width = this.y1 - this.y2
        return width
    }

    // draging functions
    get_interaction(origin, canvas, content) {
        let action = undefined
        let cursor = "auto"
        if (this.is_top_left_corner_at(origin.x, origin.y)) {
            cursor = "nwse-resize"
            action = (x, y) => { this.drag_top_left(x, y) }
        } else if (this.is_top_right_corner_at(origin.x, origin.y)) {
            cursor = "nesw-resize"
            action = (x, y) => this.drag_top_right(x, y)
        } else if (this.is_bottom_right_corner_at(origin.x, origin.y)) {
            cursor = "nwse-resize"
            action = (x, y) => this.drag_bottom_right(x, y)
        } else if (this.is_bottom_left_corner_at(origin.x, origin.y)) {
            cursor = "nesw-resize"
            action = (x, y) => this.drag_bottom_left(x, y)
        } else if (this.is_top_edge_at(origin.x, origin.y)) {
            cursor = "ns-resize"
            action = (x, y) => this.drag_top(x, y)
        } else if (this.is_right_edge_at(origin.x, origin.y)) {
            cursor = "ew-resize"
            action = (x, y) => this.drag_right(x, y)
        } else if (this.is_bottom_edge_at(origin.x, origin.y)) {
            cursor = "ns-resize"
            action = (x, y) => this.drag_bottom(x, y)
        } else if (this.is_left_edge_at(origin.x, origin.y)) {
            cursor = "ew-resize"
            action = (x, y) => this.drag_left(x, y)
        } else if (this.is_frame_at(origin.x, origin.y)) {
            cursor = "move"
            action = (x, y, z) => this.drag_frame(x, y, z)
        }
        canvas.style.cursor = cursor
        return action
    }
    drag_top(mouse, content) {
        if (mouse.y + 15 < this.y2) {
            this.y1 = mouse.y
            try_resize_clipping(this, content)
        } else {
            this.y1 = this.y2 - 15
        }
    }
    drag_right(mouse, content) {
        if (mouse.x - 15 > this.x1) {
            this.x2 = mouse.x
            try_resize_clipping(this, content)

        } else {
            this.x2 = this.x1 + 15
        }
    }
    drag_bottom(mouse, content) {
        if (mouse.y - 15 > this.y1) {
            this.y2 = mouse.y
            try_resize_clipping(this, content)

        } else {
            this.y2 = this.y1 + 15
        }
    }
    drag_left(mouse, content) {
        if (mouse.x + 15 < this.x2) {
            this.x1 = mouse.x
            try_resize_clipping(this, content)

        } else {
            this.x1 = this.x2 - 15
        }
    }
    drag_frame(mouse, content, origin) {
        this.x1 += (mouse.x - origin.x)
        this.x2 += (mouse.x - origin.x)
        this.y2 += (mouse.y - origin.y)
        this.y1 += (mouse.y - origin.y)
    }
    drag_top_left(mouse, content) {
        if (mouse.x + 15 < this.x2) {
            this.x1 = mouse.x
            try_resize_clipping(this, content)

        } else {
            this.x1 = this.x2 - 15
        }
        if (mouse.y + 15 < this.y2) {
            this.y1 = mouse.y
            try_resize_clipping(this, content)

        } else {
            this.y1 = this.y2 - 15
        }
    }
    drag_top_right(mouse, content) {
        if (mouse.x - 15 > this.x1) {
            this.x2 = mouse.x
            try_resize_clipping(this, content)

        } else {
            this.x2 = this.x1 + 15
        }
        if (mouse.y + 15 < this.y2) {
            this.y1 = mouse.y
            try_resize_clipping(this, content)

        } else {
            this.y1 = this.y2 - 15
        }
    }
    drag_bottom_left(mouse, content) {
        if (mouse.x + 15 < this.x2) {
            this.x1 = mouse.x
            try_resize_clipping(this, content)
        } else {
            this.x1 = this.x2 - 15

        }
        if (mouse.y - 15 > this.y1) {
            this.y2 = mouse.y
            try_resize_clipping(this, content)

        } else {
            this.y2 = this.y1 + 15
        }
    }
    drag_bottom_right(mouse, content) {
        if (mouse.x - 15 > this.x1) {
            this.x2 = mouse.x
            try_resize_clipping(this, content)

        } else {
            this.x2 = this.x1 + 15
        }
        if (mouse.y - 15 > this.y1) {
            this.y2 = mouse.y
            try_resize_clipping(this, content)

        } else {
            this.y2 = this.y1 + 15
        }
    }

    draw(canvas) {
        let ctx = canvas.getContext('2d')
        ctx.beginPath()
        ctx.rect(this.top(), this.left(), this.height(), this.width())
        ctx.strokeStyle = "black"
        ctx.lineWidth = 1
        ctx.stroke()
    }
    draw_hovered(canvas) {
        let ctx = canvas.getContext('2d')
        ctx.beginPath()
        ctx.rect(this.top(), this.left(), this.height(), this.width())
        ctx.strokeStyle = "aliceblue"
        ctx.lineWidth = 1
        ctx.stroke()
    }
    draw_selected(canvas) {
        let ctx = canvas.getContext('2d')
        ctx.strokeStyle = "red"
        ctx.fillStyle = "white"
        ctx.lineWidth = 1

        // draw frame
        ctx.beginPath()
        ctx.rect(this.top(), this.left(), this.height(), this.width())
        ctx.stroke()
        // draw top left corner
        ctx.beginPath()
        ctx.arc(this.x1, this.y1, 6, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
        // draw top right corner
        ctx.beginPath()
        ctx.arc(this.x1, this.y2, 6, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
        // draw bottom right corner
        ctx.beginPath()
        ctx.arc(this.x2, this.y1, 6, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
        // draw bottom left corner
        ctx.beginPath()
        ctx.arc(this.x2, this.y2, 6, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()


    }
}