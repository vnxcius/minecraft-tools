import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Reload as ReloadIcon } from "pixelarticons/react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { buildScene, type EnchantingScene } from "@/lib/enchanting-scene";
import { cn } from "@/lib/utils";

interface Props {
	/** item id without the namespace */
	item: string;
	shelves: number;
	className?: string;
}

const TARGET = new THREE.Vector3(0, 0.6, 0);

/** the enchanting table setup in 3D: drag to turn around it, scroll to zoom */
export default function EnchantingViewer({ item, shelves, className }: Props) {
	const host = useRef<HTMLDivElement>(null);
	const orbit = useRef<OrbitControls | null>(null);
	const scene = useRef<EnchantingScene | null>(null);
	const reset = useRef<() => void>(() => {});
	const redraw = useRef<() => void>(() => {});
	const { t } = useI18n();

	// the controls unhook their keydown listener from the canvas's root node: while the viewer is
	// still in the page that is the document, in a useEffect cleanup it is already the detached tree
	// and the listener left on the document kept the whole page in memory
	useLayoutEffect(
		() => () => {
			orbit.current?.dispose();
			orbit.current = null;
		},
		[],
	);

	useEffect(() => {
		const el = host.current as HTMLDivElement;
		// no MSAA with nearest filtered textures (see the armor viewer); supersample instead
		const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
		renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio, 2), 3));
		el.prepend(renderer.domElement);
		renderer.domElement.className = "block size-full touch-none";

		const world = new THREE.Scene();
		world.add(new THREE.AmbientLight(0xffffff, 2));
		const sun = new THREE.DirectionalLight(0xffffff, 1.3);
		sun.position.set(-3, 8, 5);
		world.add(sun);

		const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
		const controls = new OrbitControls(camera, renderer.domElement);
		orbit.current = controls;
		controls.enablePan = false;
		controls.minDistance = 3;
		controls.maxDistance = 16;
		controls.maxPolarAngle = Math.PI * 0.47;
		controls.target.copy(TARGET);

		const built = buildScene(() => redraw.current());
		world.add(built.root);
		scene.current = built;

		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
		const draw = (now = performance.now()) => {
			built.update(now, camera.position, !reduce.matches);
			renderer.render(world, camera);
		};
		redraw.current = () => draw();

		reset.current = () => {
			camera.position.set(3.4, 4.6, 8.4);
			controls.target.copy(TARGET);
			controls.update();
			draw();
		};
		reset.current();

		// the book and the glyphs move all the time: animate while the viewer is on screen
		let frame = 0;
		let visible = false;
		const loop = (now: number) => {
			draw(now);
			frame = visible && !reduce.matches ? requestAnimationFrame(loop) : 0;
		};
		const start = () => {
			if (!frame && visible && !reduce.matches) frame = requestAnimationFrame(loop);
		};
		const seen = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting && !document.hidden;
			start();
		});
		seen.observe(el);
		const onVisibility = () => {
			visible = !document.hidden;
			start();
		};
		document.addEventListener("visibilitychange", onVisibility);
		// a still picture only redraws when something changes
		controls.addEventListener("change", () => !frame && draw());

		const resize = () => {
			const { clientWidth: w, clientHeight: h } = el;
			if (!w || !h) return;
			renderer.setSize(w, h, false);
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			draw();
		};
		const observer = new ResizeObserver(resize);
		observer.observe(el);
		resize();

		return () => {
			cancelAnimationFrame(frame);
			seen.disconnect();
			observer.disconnect();
			document.removeEventListener("visibilitychange", onVisibility);
			built.dispose();
			scene.current = null;
			renderer.dispose();
			renderer.domElement.remove();
		};
	}, []);

	useEffect(() => {
		scene.current?.setItem(item);
		scene.current?.setShelves(shelves);
		redraw.current();
	}, [item, shelves]);

	return (
		<div ref={host} className={cn("relative overflow-hidden rounded border bg-viewer", className)}>
			<Button
				variant="outline"
				size="icon-sm"
				className="absolute top-2 right-2"
				aria-label={t("armor.resetView")}
				onClick={() => reset.current()}
			>
				<ReloadIcon />
			</Button>
			<p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-xs text-muted-foreground">
				{t("armor.dragHint")}
			</p>
		</div>
	);
}
