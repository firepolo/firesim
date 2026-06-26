class FireGasSimulation {
    constructor(width, height) {
        this.cols = width;
        this.rows = height;

        this.width = width + 2;
        this.height = height + 2;
        this.size = this.width * this.height;

        this.right = this.width - 1;
        this.bottom = this.height - 1;

        this.density = new Float32Array(this.size);
        this.u = new Float32Array(this.size);
        this.v = new Float32Array(this.size);

        this.div = new Float32Array(this.size);
        this.p = new Float32Array(this.size);

        this.tmp = new Float32Array(this.size);

        for (let i = 0; i < this.size; ++i) {
            this.density[i] = 0.0;
            const x = Math.random() - Math.random();
            const y = -0.5;
            const l = Math.sqrt(x * x + y * y);
            this.u[i] = x / l;
            this.v[i] = y / l;
        }

        this.project();
        this.bound(this.u, 1);
        this.bound(this.v, 2);
    }

    add(x, y, value) {
        this.density[Math.floor(y * this.width + x)] += value;
    }

    bound(s, b) {
        for (let i = 1; i < this.cols; ++i) {
            s[i] = b == 1 ? -s[this.width + i] : s[this.width + i];
            s[this.bottom * this.width + i] = b == 1 ? -s[this.rows * this.width + i] : s[this.rows * this.width + i];
        }

        for (let i = 1; i < this.rows; ++i) {
            s[i * this.width] = b == 2 ? -s[i * this.width + 1] : s[i * this.width + 1];
            s[i * this.width + this.right] = b == 2 ? -s[i * this.width + this.cols] : s[i * this.width + this.cols];
        }

        s[0] = (s[1] + s[this.width]) * 0.5;
        s[this.right] = (s[this.cols] + s[this.width + this.right]) * 0.5;
        s[this.bottom * this.width] = (s[this.rows * this.width] + s[this.bottom * this.width + 1]) * 0.5;
        s[this.bottom * this.width + this.right] = (s[this.rows * this.width + this.right] + s[this.rows * this.width + this.cols]) * 0.5;
    }

    bilinear(s, x, y) {
        const x0 = Math.floor(x);
        const x1 = x0 + 1.0;
        const y0 = Math.floor(y);
        const y1 = y0 + 1.0;

        const dx = x - x0;
        const dy = y - y0;

        const i00 = y0 * this.width + x0;
        const i10 = y0 * this.width + x1;
        const i01 = y1 * this.width + x0;
        const i11 = y1 * this.width + x1;

        const t = (s[i10] - s[i00]) * dx + s[i00];
        const b = (s[i11] - s[i01]) * dx + s[i01];

        return (b - t) * dy + t;
    }

    advect(s, s0, dt) {
        for (let y = 1; y <= this.rows; ++y) {
            for (let x = 1; x <= this.cols; ++x) {
                const i = y * this.width + x;
                const ox = Math.max(0.5, Math.min(x - this.u[i] * dt, this.cols + 0.5));
                const oy = Math.max(0.5, Math.min(y - this.v[i] * dt, this.rows + 0.5));
                s[i] = this.bilinear(s0, ox, oy);
            }
        }

        this.bound(s, 0);
    }

    project() {
        for (let y = 1; y < this.rows; ++y) {
            for (let x = 1; x < this.cols; ++x) {
                const i = y * this.width + x;
                this.div[i] = (this.u[i + 1] + this.u[i - 1]) * -0.5 + (this.v[i + this.width] + this.v[i - this.width]) * -0.5;
                this.p[i] = 0.0
            }
        }

        for (let i = 0; i < 20; ++i) {
            for (let y = 1; y < this.rows; ++y) {
                for (let x = 1; x < this.cols; ++x) {
                    const i = y * this.width + x;
                    this.p[i] = (this.p[i - 1] + this.p[i + 1] + this.p[i - this.width] + this.p[i + this.width] - this.div[i]) / 4.0;
                }
            }

            this.bound(this.p, 0);
        }

        for (let y = 1; y < this.rows; ++y) {
            for (let x = 1; x < this.cols; ++x) {
                const i = y * this.width + x;
                this.u[i] -= (this.p[i + 1] - this.p[i - 1]) * 0.5;
                this.v[i] -= (this.p[i + this.width] - this.p[i - this.width]) * 0.5;
            }
        }
    }

    update(dt) {
        this.advect(this.tmp, this.density, dt);

        this.density.set(this.tmp);

        const totalDensity = this.density.reduce((a, d) => a + d, 0);
        if (totalDensity > 100.0) console.log(totalDensity);
    }

    draw(ctx) {
        for (let y = 1; y <= this.rows; ++y) {
            for (let x = 1; x <= this.cols; ++x) {
                const i = y * this.width + x;

                const density = Math.min(Math.max(0.0, this.density[i]), 1.0) * 255;

                ctx.fillStyle = `rgb(${density},${density},${density}`;
                //ctx.fillStyle = `rgb(${128 + this.u[i] * 127},${128 + this.v[i] * 127},${density}`;
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

    if (mouse.down) simulation.add(mouse.x, mouse.y, 10);
    simulation.update(dt);

    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    simulation.draw(context);

    requestAnimationFrame(tick);
}

requestAnimationFrame(tick);