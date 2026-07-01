class Room {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.area = width * height;
        this.inverseArea = 1.0 / this.area;

        this.smoke = 0.0;
    }

    addSmoke(x, y, value) {
        if (x < this.x || x >= this.x + this.width || y < this.y || y >= this.y + this.height) return;
        this.smoke += this.inverseArea * value;
    }

    update(dt) {
    }

    draw(ctx) {
        ctx.strokeStyle = '#000';
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        const smoke = Math.floor((1.0 - Math.min(Math.max(this.smoke, 0.0), 1.0)) * 255);
        ctx.fillStyle = `rgb(${smoke}, ${smoke}, ${smoke})`;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = '#000';
        ctx.fillText(this.smoke.toFixed(2), this.x, this.y + this.height);
    }
}

const canvas = document.createElement('canvas');
canvas.width = 1024;
canvas.height = 576;
canvas.style = 'border: 1px solid #000;';
document.body.appendChild(canvas);

const context = canvas.getContext("2d");
const mouse = { buttons: [false, false, false, false, false], x: 0, y: 0 };

const rooms = [
    new Room(0, 0, 128, 64),
    new Room(128, 32, 64, 32),
    new Room(192, 32, 128, 128)
];

const links = [
    { a: 0, b: 1, width: 32, open: true },
    { a: 1, b: 2, width: 32, open: false }
];

canvas.onmousedown = canvas.onmouseup = (e) => {
    mouse.buttons[e.button] = e.type == 'mousedown';
    canvas.onmousemove(e)
}

canvas.onmousemove = (e) => {
    if (!mouse.buttons.includes(true)) return;
    const b = e.target.getBoundingClientRect();
    mouse.x = Math.floor(canvas.width / b.width * (e.clientX - b.x) + 0.5);
    mouse.y = Math.floor(canvas.height / b.height * (e.clientY - b.y) + 0.5);
}

let last = performance.now();

function tick(now)
{
    const dt = (now - last) * 0.01;
    last = now;

    if (mouse.buttons[0]) {
        for (const simulation of rooms) simulation.addSmoke(mouse.x, mouse.y, 5.0);
    }
    if (mouse.buttons[1]) {
        links[1].open = !links[1].open;
        console.log(links[1].open)
    }
    
    for (const simulation of rooms) simulation.update(dt);
    for (const link of links) {
        if (!link.open) continue;
        const a = rooms[link.a];
        const b = rooms[link.b];
        const delta = b.smoke - a.smoke;
        const flow = delta * dt * 1.0;
        const mass = flow * link.width;
        a.smoke += mass / a.area;
        b.smoke -= mass / b.area;
    }

    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (const simulation of rooms) simulation.draw(context);

    requestAnimationFrame(tick);
}

requestAnimationFrame(tick);