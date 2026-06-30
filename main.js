class FireGasSimulation {
    constructor(width, height) {
        this.cols = width;
        this.rows = height;

        this.width = width + 2;
        this.height = height + 2;
        this.size = this.width * this.height;

        this.right = this.width - 1;
        this.bottom = this.height - 1;

        this.u = new Float32Array(this.size);
        this.v = new Float32Array(this.size);
        this.smoke = new Float32Array(this.size);
        this.tmp = new Float32Array(this.size);
        
        this.u.fill(0.0);
        this.v.fill(0.0);
        this.smoke.fill(0.0);
    }

    addSmoke(x, y, value) {
        this.smoke[y * this.width + x] += value;
    }

    addVelocity(x, y, u, v) {
        this.u[y * this.width + x] += u;
        this.v[y * this.width + x] += v;
    }

    update(dt) {
        this.tmp.fill(0);

        for (let y = 1; y <= this.rows; ++y) {
            for (let x = 1; x <= this.cols; ++x) {
                const i = y * this.width + x;
                const density = this.smoke[i];
                const hi = 1.0 - y / this.rows;
                const turbulence = Math.random() - Math.random();
                const d = density / 2.5;
                const v = (d * (1.0 - d) * 3.0) + this.v[i];
                
                const spread = hi * (1.0 - Math.max(0.0, v));
                const u = (Math.sin((y + performance.now() * 0.001) * 0.5) * spread * 0.2 + turbulence * (0.2 + spread)) + this.u[i];

                const nx = Math.min(Math.max(1, x - u * dt), this.cols);
                const ny = Math.min(Math.max(1, y - v * dt), this.rows);

                const x0 = Math.floor(nx);
                const y0 = Math.floor(ny);
                const x1 = x0 + 1.0;
                const y1 = y0 + 1.0;
                const dx = nx - x0;
                const dy = ny - y0;

                const w00 = (1 - dx) * (1 - dy);
                const w10 = dx * (1 - dy);
                const w01 = (1 - dx) * dy;
                const w11 = dx * dy;

                this.tmp[y0 * this.width + x0] += w00 * density;
                this.tmp[y0 * this.width + x1] += w10 * density;
                this.tmp[y1 * this.width + x0] += w01 * density;
                this.tmp[y1 * this.width + x1] += w11 * density;
            }
        }

        this.smoke.set(this.tmp);
    }

    draw(ctx) {
        for (let y = 1; y <= this.rows; ++y) {
            for (let x = 1; x <= this.cols; ++x) {
                const i = y * this.width + x;

                const smoke = Math.min(Math.max(0.0, this.smoke[i]), 1.0) * 255;
                ctx.fillStyle = `rgb(${128 + this.u[i] * 127},${128 + this.v[i] * 127},${smoke}`;
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
const mouse = { buttons: [false, false, false, false, false], x: 0, y: 0 };

const simulation = new FireGasSimulation(canvas.width, canvas.height);

/*window.onkeydown = (e) => {
    if (e.key == 'q') simulation.add(Math.floor(canvas.width * 0.5), canvas.height - 4, 10);
}*/

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

    if (mouse.buttons[0]) simulation.addSmoke(mouse.x, mouse.y, 0.1);
    if (mouse.buttons[1]) simulation.addVelocity(mouse.x, mouse.y, -1.0, 0.0);
    simulation.update(dt);

    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    simulation.draw(context);

    requestAnimationFrame(tick);
}

requestAnimationFrame(tick);