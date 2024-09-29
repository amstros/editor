
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
            this.selection_mode()
        })
    }

    selection_mode() {
        this.reset_canvas()
        this.draw_content()

        let clicked = undefined
        let hovered = undefined
        let selected = undefined

        this.canvas.addEventListener("mousemove", (event) => {
            let mouse = get_mouse_pos(this.canvas, event)
            this.draw_content()

            let found = undefined
            this.content.forEach(element => {
                if (found == undefined) {
                    if (element.is_at(mouse.x, mouse.y) && (hovered == element || hovered == undefined)) {
                        found = element
                        hovered = element
                        element.draw_hovered(this.canvas)
                    }
                }

                if (selected && clicked) {
                    document.getElementById('infos').innerHTML = (mouse.x - clicked.x) + " ; " + (mouse.y - clicked.y)
                    selected.x1 += mouse.x - clicked.x
                    selected.x2 += mouse.x - clicked.x
                    selected.y1 += mouse.y - clicked.y
                    selected.y2 += mouse.y - clicked.y
                    clicked = mouse
                }

                if (selected) {
                    selected.draw_selected(this.canvas)
                }
            })

            if (!found) {
                hovered = undefined
            }

        })

        this.canvas.addEventListener("mousedown", (event) => {
            this.draw_content()
            clicked = get_mouse_pos(this.canvas, event)
            if (hovered != undefined) {
                selected = hovered
                selected.draw_selected(this.canvas)

            } else {
                selected = undefined
            }



        })

        this.canvas.addEventListener("mouseup", (event) => {
            clicked = undefined
        })
    }
}


class Element {
    constructor(id, x1, y1, x2, y2) {
        this.id = id
        this.x1 = x1
        this.x2 = x2
        this.y1 = y1
        this.y2 = y2

    }

    is_at(x, y) {
        let res = true
        res = res && (x > this.top() && x < this.top() + this.height())
        res = res && (y > this.left() && y < this.left() + this.width())
        return res
    }

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
        ctx.beginPath()
        ctx.rect(this.top(), this.left(), this.height(), this.width())
        ctx.strokeStyle = "red"
        ctx.lineWidth = 1
        ctx.stroke()
    }
}