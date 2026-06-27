class FireGasSimulation {
    constructor(width, height) {
        this.cols = width;
        this.rows = height;

        this.width = width + 2;
        this.height = height + 2;
        this.size = this.width * this.height;

        this.right = this.width - 1;
        this.bottom = this.height - 1;

        this.smoke = new Float32Array(this.size);
        this.tmp = new Float32Array(this.size);

        for (let i = 0; i < this.size; ++i) {
            this.smoke[i] = 0.0;
        }
    }

    add(x, y, value) {
        this.smoke[Math.floor(y * this.width + x)] += value;
    }
    
    bilinear(s, x, y) {
        const x0 = Math.floor(x);
        const x1 = x0 + 1.0;
        const y0 = Math.floor(y);
        const y1 = y0 + 1.0;

        const dx = x - x0;
        const dy = y - y0;

        const s00 = s[y0 * this.width + x0];
        const s10 = s[y0 * this.width + x1];
        const s01 = s[y1 * this.width + x0];
        const s11 = s[y1 * this.width + x1];

        const t = (s10 - s00) * dx + s00;
        const b = (s11 - s01) * dx + s01;

        return (b - t) * dy + t;
    }

    update(dt) {
        for (let y = 1; y <= this.rows; ++y) {
            for (let x = 1; x <= this.cols; ++x) {
                const i = y * this.width + x;
                const h = y / this.rows;
                const turbulence = Math.random() - Math.random();
                const u = turbulence;
                const v = -0.5;
                const ox = Math.min(Math.max(0.5, x - u * dt), this.cols + 0.5);
                const oy = Math.min(Math.max(0.5, y - v * dt), this.rows + 0.5);
                this.tmp[i] = this.bilinear(this.smoke, ox, oy);
            }
        }

        this.smoke.set(this.tmp);

        //console.log(totalSmoke);
    }

    draw(ctx) {
        for (let y = 1; y <= this.rows; ++y) {
            for (let x = 1; x <= this.cols; ++x) {
                const i = y * this.width + x;

                const smoke = Math.min(Math.max(0.0, this.smoke[i]), 1.0) * 255;

                ctx.fillStyle = `rgb(${smoke},${smoke},${smoke}`;
                //ctx.fillStyle = `rgb(${128 + this.u[i] * 127},${128 + this.v[i] * 127},${smoke}`;
                ctx.fillRect(x - 1, y - 1, 1, 1);
            }
        }
    }
}

const CellSize = 16;
const canvas = document.createElement('canvas');
canvas.width = 64;
canvas.height = 32;
canvas.style = `border: 1px solid #000;width:${canvas.width * CellSize}px;height:${canvas.height * CellSize}px;`;
document.body.appendChild(canvas);

const context = canvas.getContext("2d");
const mouse = { down: false, x: 0, y: 0 };

const simulation = new FireGasSimulation(canvas.width, canvas.height);

/*window.onkeydown = (e) => {
    if (e.key == 'q') simulation.add(Math.floor(canvas.width * 0.5), canvas.height - 4, 10);
}*/

canvas.onmousedown = canvas.onmouseup = (e) => {
    mouse.down = e.type == 'mousedown';
    canvas.onmousemove(e)
}

canvas.onmousemove = (e) => {
    if (!mouse.down) return;
    const b = e.target.getBoundingClientRect();
    mouse.x = Math.floor(canvas.width / b.width * (e.clientX - b.x) + 0.5);
    mouse.y = Math.floor(canvas.height / b.height * (e.clientY - b.y) + 0.5);
}

let last = performance.now();

function tick(now)
{
    const dt = (now - last) * 0.01;
    last = now;

    if (mouse.down) simulation.add(mouse.x, mouse.y, 1.0);
    simulation.update(dt);

    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    simulation.draw(context);

    requestAnimationFrame(tick);
}

requestAnimationFrame(tick);