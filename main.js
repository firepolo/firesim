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
        
        this.time = 0.0;

        for (let i = 0; i < this.size; ++i) {
            this.smoke[i] = 0.0;
        }
    }

    add(x, y, value) {
        this.smoke[y * this.width + x] += value;
    }

    update(dt) {
        this.tmp.fill(0);

        this.time += dt;
        const frag = 0.5 / this.rows;

        for (let y = 1; y <= this.rows; ++y) {
            for (let x = 1; x <= this.cols; ++x) {
                const i = y * this.width + x;
                const density = this.smoke[i];
                const u = (Math.random() - Math.random()) * (0.5 + density);
                //const u = Math.cos((y + this.time) * 0.5) * 0.5;
                const v = 1.0 - density;

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

                /*const density = this.smoke[i] 
                const k = 0.1 + 0.4 * density;
                const smoke = density * (1 - k) + (this.smoke[i - this.width] + this.smoke[i - 1] + this.smoke[i + 1] + this.smoke[i + this.width]) * (k * 0.25);
                const gray = Math.min(Math.max(0.0, smoke), 1.0) * 255;*/
                const gray = Math.min(Math.max(0.0, this.smoke[i]), 1.0) * 255;
                ctx.fillStyle = `rgb(${gray},${gray},${gray}`;
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

    if (mouse.down) simulation.add(mouse.x, mouse.y, 0.1);
    simulation.update(dt);

    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    simulation.draw(context);

    requestAnimationFrame(tick);
}

requestAnimationFrame(tick);