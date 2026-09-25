import { useEffect, useRef } from "react";
import { useI18n } from "@/i18n";
import { colorById, type Firework, type Shape } from "@/lib/firework";
import { cn } from "@/lib/utils";

interface Props {
	firework: Firework;
	/** change it to launch the rocket again */
	replayKey: number;
	className?: string;
}

// logical size of the sky, the canvas is scaled to the device pixel ratio
const W = 360;
const H = 440;
const GROUND = H - 36;
const DRAG = 2.8; // per second
const GRAVITY = 40; // px per second squared

type Vec = [number, number];
type Rgb = [number, number, number];

const CREEPER_FACE = [
	"........",
	".##..##.",
	".##..##.",
	"...##...",
	"..####..",
	"..####..",
	"..#..#..",
	"........",
];

const toRgb = (id: string): Rgb => {
	const { rgb } = colorById(id);
	return [(rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255];
};

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/** start velocities (unit length) that draw the shape once the particles have spread out */
function shapeVectors(shape: Shape): { vectors: Vec[]; radius: number } {
	const vectors: Vec[] = [];
	switch (shape) {
		case "small_ball":
		case "large_ball": {
			const count = shape === "small_ball" ? 30 : 48;
			for (let i = 0; i < count; i++) {
				const angle = Math.random() * Math.PI * 2;
				const r = Math.sqrt(0.35 + Math.random() * 0.65);
				vectors.push([Math.cos(angle) * r, Math.sin(angle) * r]);
			}
			return { vectors, radius: shape === "small_ball" ? 75 : 110 };
		}
		case "star": {
			// a five pointed star outline
			const points: Vec[] = Array.from({ length: 10 }, (_, i) => {
				const angle = -Math.PI / 2 + (i * Math.PI) / 5;
				const r = i % 2 === 0 ? 1 : 0.45;
				return [Math.cos(angle) * r, Math.sin(angle) * r];
			});
			for (let i = 0; i < points.length; i++) {
				const [a, b] = [points[i], points[(i + 1) % points.length]];
				for (let s = 0; s < 4; s++) {
					vectors.push([a[0] + ((b[0] - a[0]) * s) / 4, a[1] + ((b[1] - a[1]) * s) / 4]);
				}
			}
			return { vectors, radius: 95 };
		}
		case "creeper": {
			CREEPER_FACE.forEach((row, y) => {
				[...row].forEach((cell, x) => {
					if (cell === "#") vectors.push([(x - 3.5) / 3.5, (y - 3.5) / 3.5]);
				});
			});
			return { vectors, radius: 90 };
		}
		case "burst": {
			for (let i = 0; i < 36; i++) {
				const angle = Math.random() * Math.PI * 2;
				const r = 0.25 + Math.random() * 0.85;
				vectors.push([Math.cos(angle) * r, Math.sin(angle) * r]);
			}
			return { vectors, radius: 110 };
		}
	}
}

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	age: number;
	life: number;
	from: Rgb;
	to: Rgb | null;
	trail: boolean;
	twinkle: boolean;
	size: number;
	history: Vec[];
}

function explode(firework: Firework, x: number, y: number) {
	const particles: Particle[] = [];
	for (const star of firework.stars) {
		const { vectors, radius } = shapeVectors(star.shape);
		const from = star.colors.map(toRgb);
		const to = star.fade.map(toRgb);
		for (const [vx, vy] of vectors) {
			particles.push({
				x,
				y,
				vx: vx * radius * DRAG,
				vy: vy * radius * DRAG,
				age: 0,
				life: 1.5 + Math.random() * 0.5,
				from: from.length ? pick(from) : [240, 240, 240],
				to: to.length ? pick(to) : null,
				trail: star.trail,
				twinkle: star.twinkle,
				size: star.shape === "large_ball" ? 4 : 3.2,
				history: [],
			});
		}
	}
	return particles;
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
	a[0] + (b[0] - a[0]) * t,
	a[1] + (b[1] - a[1]) * t,
	a[2] + (b[2] - a[2]) * t,
];

const SKY_STARS = Array.from({ length: 50 }, (_, i) => ({
	x: ((i * 97) % 360) + ((i * 13) % 7),
	y: ((i * 53) % (GROUND - 40)) + ((i * 7) % 5),
	s: i % 5 === 0 ? 2 : 1,
}));

function drawBackground(ctx: CanvasRenderingContext2D) {
	const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
	sky.addColorStop(0, "#070a16");
	sky.addColorStop(1, "#1b2440");
	ctx.fillStyle = sky;
	ctx.fillRect(0, 0, W, GROUND);
	ctx.fillStyle = "rgb(255 255 255 / 0.55)";
	for (const star of SKY_STARS) ctx.fillRect(star.x, star.y, star.s, star.s);
	ctx.fillStyle = "#5fa03a";
	ctx.fillRect(0, GROUND, W, 6);
	ctx.fillStyle = "#4a3a30";
	ctx.fillRect(0, GROUND + 6, W, H - GROUND - 6);
}

export default function FireworkCanvas({ firework, replayKey, className }: Props) {
	const i18n = useI18n();
	const ref = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ratio = Math.max(window.devicePixelRatio, 1);
		canvas.width = W * ratio;
		canvas.height = H * ratio;
		const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.scale(ratio, ratio);

		const rise = 0.7 + 0.45 * firework.flight;
		const apex = GROUND - 120 - 55 * firework.flight;
		let particles: Particle[] = [];
		const sparks: { x: number; y: number; age: number }[] = [];
		let exploded = false;
		let time = 0;
		let last = performance.now();
		let frame = 0;

		const tick = (now: number) => {
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;
			time += dt;
			drawBackground(ctx);

			if (!exploded) {
				const t = Math.min(time / rise, 1);
				const y = GROUND - (GROUND - apex) * (1 - (1 - t) * (1 - t));
				sparks.push({ x: W / 2 + (Math.random() - 0.5) * 3, y, age: 0 });
				ctx.fillStyle = "#e8e3d3";
				ctx.fillRect(W / 2 - 1.5, y - 5, 3, 9);
				if (t >= 1) {
					exploded = true;
					particles = explode(firework, W / 2, apex);
				}
			}
			for (let i = sparks.length - 1; i >= 0; i--) {
				const spark = sparks[i];
				spark.age += dt;
				if (spark.age > 0.5) {
					sparks.splice(i, 1);
					continue;
				}
				ctx.fillStyle = `rgb(255 170 60 / ${1 - spark.age * 2})`;
				ctx.fillRect(spark.x - 1, spark.y + 5 + spark.age * 30, 2, 2);
			}

			ctx.globalCompositeOperation = "lighter";
			particles = particles.filter((p) => p.age < p.life);
			for (const p of particles) {
				p.age += dt;
				p.vx *= Math.exp(-DRAG * dt);
				p.vy = p.vy * Math.exp(-DRAG * dt) + GRAVITY * dt;
				p.x += p.vx * dt;
				p.y += p.vy * dt;
				if (p.trail) {
					p.history.push([p.x, p.y]);
					if (p.history.length > 9) p.history.shift();
				}

				const f = p.age / p.life;
				const color = p.to && f > 0.5 ? mix(p.from, p.to, Math.min((f - 0.5) / 0.4, 1)) : p.from;
				let alpha = f < 0.7 ? 1 : Math.max(1 - (f - 0.7) / 0.3, 0);
				if (p.twinkle && f > 0.45) alpha *= Math.random() > 0.45 ? 1 : 0.15;
				const [r, g, b] = color.map(Math.round);

				p.history.forEach(([hx, hy], i) => {
					const a = (i / p.history.length) * alpha * 0.5;
					ctx.fillStyle = `rgb(${r} ${g} ${b} / ${a})`;
					ctx.fillRect(hx - p.size / 2, hy - p.size / 2, p.size * 0.8, p.size * 0.8);
				});
				ctx.fillStyle = `rgb(${r} ${g} ${b} / ${alpha})`;
				ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
			}
			ctx.globalCompositeOperation = "source-over";

			if (!exploded || particles.length > 0 || sparks.length > 0)
				frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
		// replayKey is not read inside, it only restarts the show
		// oxlint-disable-next-line react/exhaustive-effect-dependencies
	}, [firework, replayKey]);

	return (
		<canvas
			ref={ref}
			role="img"
			aria-label={i18n.t("firework.previewLabel")}
			className={cn("aspect-360/440 w-full max-w-90 rounded", className)}
		/>
	);
}
