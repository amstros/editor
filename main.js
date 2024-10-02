
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
                if (element.is_at(mouse.x, mouse.y) && !found) {
                    element.draw_hovered(this.canvas)
                    hovered = element
                    found = true
                }
            })
        })

        this.canvas.addEventListener("mousedown", (event) => {
            if (hovered != undefined) {
                this.edit_mode(hovered)
            }
        })

    }

    edit_mode(element) {
        this.reset_canvas()
        this.draw_content()
        element.draw_selected(this.canvas)

        let item = undefined
        let click = undefined

        this.canvas.addEventListener("mousemove", (event) => {
            let mouse = get_mouse_pos(this.canvas, event)
            if (click) {
                switch (item) {
                    case 0:
                        element.drag_top_left(mouse)
                        break;
                    case 1:
                        element.drag_top_right(mouse)
                        break;
                    case 2:
                        element.drag_bottom_left(mouse)
                        break;
                    case 3:
                        element.drag_bottom_right(mouse)
                        break;
                    case 4:
                        element.drag_frame(mouse,click)
                        click = mouse
                        break;
                    case 5: break;
                    default:
                        break;
                }
                this.draw_content()
                element.draw_selected(this.canvas)

            }
        })

        this.canvas.addEventListener("mousedown", (event) => {
            let mouse = get_mouse_pos(this.canvas, event)
            click = mouse
            if (distance(mouse.x, mouse.y, element.x1, element.y1) <= 6) {
                item = 0
            } else if (distance(mouse.x, mouse.y, element.x2, element.y1) <= 6) {
                item = 1
            } else if (distance(mouse.x, mouse.y, element.x1, element.y2) <= 6) {
                item = 2
            } else if (distance(mouse.x, mouse.y, element.x2, element.y2) <= 6) {
                item = 3
            } else if (element.is_at(mouse.x, mouse.y)) {
                item = 4
            } else {
                item = undefined
                this.selection_mode()
            }
        })

        this.canvas.addEventListener("mouseup", (event) => {
            click = undefined
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

    drag_frame(mouse, origin) {
        this.x1 += (mouse.x - origin.x)
        this.x2 += (mouse.x - origin.x)
        this.y2 += (mouse.y - origin.y)
        this.y1 += (mouse.y - origin.y)
    }

    drag_top_left(mouse) {
        if (mouse.x + 15 < this.x2) {
            this.x1 = mouse.x
        } else {
            this.x1 = this.x2 - 15
        }

        if (mouse.y + 15 < this.y2) {
            this.y1 = mouse.y
        } else {
            this.y1 = this.y2 - 15
        }
    }

    drag_top_right(mouse) {
        if (mouse.x - 15 > this.x1) {
            this.x2 = mouse.x
        } else {
            this.x2 = this.x1 + 15
        }
        if (mouse.y + 15 < this.y2) {
            this.y1 = mouse.y

        } else {
            this.y1 = this.y2 - 15
        }
    }

    drag_bottom_left(mouse) {
        if (mouse.x + 15 < this.x2) {
            this.x1 = mouse.x
        } else {
            this.x1 = this.x2 - 15
        }
        if (mouse.y - 15 > this.y1) {
            this.y2 = mouse.y
        } else {
            this.y2 = this.y1 + 15
        }
    }

    drag_bottom_right(mouse) {
        if (mouse.x - 15 > this.x1) {
            this.x2 = mouse.x
        } else {
            this.x2 = this.x1 + 15
        }
        if (mouse.y - 15 > this.y1) {
            this.y2 = mouse.y
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