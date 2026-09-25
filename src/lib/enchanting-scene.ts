/**
 * The enchanting table in 3D: the table with its floating book, the bookshelves around it, the
 * item being enchanted floating above, and the glyphs that fly from the shelves into the table.
 *
 * One unit is one block; the table stands on the origin. The book, its animation and the glyphs
 * follow the game's code (26.3: BookModel, EnchantTableRenderer, EnchantingTableBlockEntity,
 * EnchantingTableBlock.animateTick, FlyTowardsPositionParticle); textures come from
 * scripts/sync-enchanting-scene.ts.
 */
import * as THREE from "three";
import { buildBox } from "@/lib/armor/geometry";

const TEX = "/enchanting";

const loader = new THREE.TextureLoader();
const textures = new Map<string, THREE.Texture>();
/** told when a texture arrives, so a still picture can be drawn again */
const loaded = new Set<() => void>();

function texture(name: string) {
	let tex = textures.get(name);
	if (!tex) {
		tex = loader.load(`${TEX}/${name}.png`, () => {
			for (const listener of loaded) listener();
		});
		tex.colorSpace = THREE.SRGBColorSpace;
		tex.magFilter = THREE.NearestFilter;
		tex.minFilter = THREE.NearestFilter;
		tex.generateMipmaps = false;
		textures.set(name, tex);
	}
	return tex;
}

const lambert = (map: THREE.Texture, transparent = false) =>
	new THREE.MeshLambertMaterial({ map, transparent, alphaTest: transparent ? 0.1 : 0 });

/**
 * Where bookshelves go, in the order they are added, all on the ground two blocks away: the back
 * row, the two sides, the front corners and then the spots next to them, which leaves only the
 * middle of the front open to walk up to the table. The game counts any of the 32 spots two blocks
 * away (EnchantingTableBlock.BOOKSHELF_OFFSETS) with air in between, and at most 15 of them.
 */
const SHELF_SPOTS: [number, number, number][] = [
	[-2, 0, -2],
	[-1, 0, -2],
	[0, 0, -2],
	[1, 0, -2],
	[2, 0, -2],
	[-2, 0, -1],
	[-2, 0, 0],
	[-2, 0, 1],
	[2, 0, -1],
	[2, 0, 0],
	[2, 0, 1],
	[-2, 0, 2],
	[2, 0, 2],
	[-1, 0, 2],
	[1, 0, 2],
];

/** a block of the given size standing on the ground, one texture for the sides */
function block(side: string, top: string, bottom: string, height = 1) {
	const geometry = new THREE.BoxGeometry(1, height, 1);
	// the side texture's lower part is the side of a shorter block (the table is 12 pixels tall)
	const uv = geometry.getAttribute("uv") as THREE.BufferAttribute;
	for (let face = 0; face < 6; face++) {
		if (face === 2 || face === 3) continue; // +y and -y
		for (let i = face * 4; i < face * 4 + 4; i++) uv.setY(i, uv.getY(i) * height);
	}
	geometry.translate(0, height / 2, 0);
	const sides = lambert(texture(side));
	return new THREE.Mesh(geometry, [
		sides,
		sides,
		lambert(texture(top)),
		lambert(texture(bottom)),
		sides,
		sides,
	]);
}

// ---- the book (BookModel: 64x32 texture, pixels, y up as the block entity renders it) ----

type BookPart = "leftLid" | "rightLid" | "leftPages" | "rightPages" | "flip1" | "flip2";

interface Book {
	root: THREE.Group;
	parts: Record<BookPart, THREE.Group>;
}

function buildBook(): Book {
	const material = new THREE.MeshLambertMaterial({
		map: texture("book"),
		transparent: true,
		alphaTest: 0.1,
		side: THREE.DoubleSide,
	});
	const tex: [number, number] = [64, 32];
	// buildBox turns the game's entity space (y down, front -z) into three.js space; the book is
	// drawn without that flip, so everything sits in a group turned half a turn around x
	const model = new THREE.Group();
	model.rotation.x = Math.PI;
	const part = (
		offset: [number, number, number],
		origin: [number, number, number],
		size: [number, number, number],
		uv: [number, number],
		yRot = 0,
	) => {
		const group = new THREE.Group();
		group.position.set(offset[0], -offset[1], -offset[2]);
		// a turn around the game's y is the opposite turn in the flipped space
		group.rotation.y = -yRot;
		group.add(new THREE.Mesh(buildBox({ pivot: offset, origin, size, uv, tex }), material));
		model.add(group);
		return group;
	};
	const parts = {
		leftLid: part([0, 0, -1], [-6, -5, -0.005], [6, 10, 0.005], [0, 0]),
		rightLid: part([0, 0, 1], [0, -5, -0.005], [6, 10, 0.005], [16, 0]),
		leftPages: part([0, 0, 0], [0, -4, -0.99], [5, 8, 1], [0, 10]),
		rightPages: part([0, 0, 0], [0, -4, -0.01], [5, 8, 1], [12, 10]),
		flip1: part([0, 0, 0], [0, -4, 0], [5, 8, 0.005], [24, 10]),
		flip2: part([0, 0, 0], [0, -4, 0], [5, 8, 0.005], [24, 10]),
	};
	part([0, 0, 0], [-1, -5, 0], [2, 10, 0.005], [12, 0], Math.PI / 2);
	model.scale.setScalar(1 / 16);
	const root = new THREE.Group();
	root.add(model);
	return { root, parts };
}

/** BookModel.setupAnim: how far the book is open and where both flipping pages are */
function poseBook(book: Book, openness: number, flip1: number, flip2: number) {
	const f = openness;
	const set = (name: BookPart, yRot: number, x = 0) => {
		const group = book.parts[name];
		group.rotation.y = -yRot;
		group.position.x = x;
	};
	set("leftLid", Math.PI + f);
	set("rightLid", -f);
	set("leftPages", f, Math.sin(f));
	set("rightPages", -f, Math.sin(f));
	set("flip1", f - f * 2 * flip1, Math.sin(f));
	set("flip2", f - f * 2 * flip2, Math.sin(f));
}

/** EnchantingTableBlockEntity.bookAnimationTick, with a player always nearby */
class BookState {
	time = 0;
	flip = 0;
	oFlip = 0;
	flipT = 0;
	flipA = 0;
	open = 0;
	oOpen = 0;
	rot = 0;
	oRot = 0;

	tick(target: number) {
		this.oOpen = this.open;
		this.oRot = this.rot;
		this.open += 0.1;
		if (this.open < 0.5 || Math.floor(Math.random() * 40) === 0) {
			const before = this.flipT;
			do this.flipT += Math.floor(Math.random() * 4) - Math.floor(Math.random() * 4);
			while (before === this.flipT);
		}
		const wrap = (a: number) => {
			while (a >= Math.PI) a -= Math.PI * 2;
			while (a < -Math.PI) a += Math.PI * 2;
			return a;
		};
		this.rot = wrap(this.rot);
		this.rot += wrap(target - this.rot) * 0.4;
		this.open = Math.min(Math.max(this.open, 0), 1);
		this.time++;
		this.oFlip = this.flip;
		const f = Math.min(Math.max((this.flipT - this.flip) * 0.4, -0.2), 0.2);
		this.flipA += (f - this.flipA) * 0.9;
		this.flip += this.flipA;
	}
}

const frac = (x: number) => x - Math.floor(x);
const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);

// ---- the item, a flat sprite pushed out one pixel deep like a dropped item ----

function itemMesh(id: string, onReady: () => void) {
	const group = new THREE.Group();
	const map = texture(`items/${id}`);
	// one-sided faces: seen through its transparent pixels, a two-sided back face would show the
	// sprite mirrored over the front one (a sword became an X)
	const material = new THREE.MeshLambertMaterial({ map, alphaTest: 0.1 });
	const edges = new THREE.MeshLambertMaterial({ map, alphaTest: 0.1, side: THREE.DoubleSide });
	const depth = 1 / 16;
	// front and back
	for (const z of [depth / 2, -depth / 2]) {
		const geometry = new THREE.PlaneGeometry(1, 1);
		if (z < 0) {
			// the back faces away, but each pixel stays where it is on the front: a half turn moves
			// the pixels to the other side, so the texture is flipped back
			geometry.rotateY(Math.PI);
			const uv = geometry.getAttribute("uv") as THREE.BufferAttribute;
			for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
		}
		geometry.translate(0, 0, z);
		group.add(new THREE.Mesh(geometry, material));
	}
	// the edges: one strip per pixel border that faces a transparent pixel
	const image = map.image as HTMLImageElement | undefined;
	const addEdges = (img: HTMLImageElement) => {
		const canvas = document.createElement("canvas");
		canvas.width = 16;
		canvas.height = 16;
		const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.drawImage(img, 0, 0);
		const alpha = ctx.getImageData(0, 0, 16, 16).data;
		const solid = (x: number, y: number) =>
			x >= 0 && y >= 0 && x < 16 && y < 16 && alpha[(y * 16 + x) * 4 + 3] > 25;
		const positions: number[] = [];
		const uvs: number[] = [];
		const quad = (corners: number[][], u: number, v: number) => {
			for (const i of [0, 1, 2, 0, 2, 3]) {
				positions.push(...corners[i]);
				uvs.push(u, v);
			}
		};
		const h = depth / 2;
		for (let y = 0; y < 16; y++) {
			for (let x = 0; x < 16; x++) {
				if (!solid(x, y)) continue;
				const x0 = x / 16 - 0.5;
				const x1 = x0 + 1 / 16;
				const y1 = 0.5 - y / 16;
				const y0 = y1 - 1 / 16;
				const u = (x + 0.5) / 16;
				const v = 1 - (y + 0.5) / 16;
				if (!solid(x - 1, y))
					quad(
						[
							[x0, y0, -h],
							[x0, y0, h],
							[x0, y1, h],
							[x0, y1, -h],
						],
						u,
						v,
					);
				if (!solid(x + 1, y))
					quad(
						[
							[x1, y0, h],
							[x1, y0, -h],
							[x1, y1, -h],
							[x1, y1, h],
						],
						u,
						v,
					);
				if (!solid(x, y - 1))
					quad(
						[
							[x0, y1, h],
							[x1, y1, h],
							[x1, y1, -h],
							[x0, y1, -h],
						],
						u,
						v,
					);
				if (!solid(x, y + 1))
					quad(
						[
							[x0, y0, -h],
							[x1, y0, -h],
							[x1, y0, h],
							[x0, y0, h],
						],
						u,
						v,
					);
			}
		}
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
		geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
		geometry.computeVertexNormals();
		group.add(new THREE.Mesh(geometry, edges));
		onReady();
	};
	if (image?.complete && image.naturalWidth) addEdges(image);
	else {
		const img = new Image();
		img.onload = () => addEdges(img);
		img.src = `${TEX}/items/${id}.png`;
	}
	return group;
}

// ---- the glyphs (FlyTowardsPositionParticle, the enchant provider) ----

interface Glyph {
	sprite: THREE.Sprite;
	start: THREE.Vector3;
	velocity: THREE.Vector3;
	age: number;
	lifetime: number;
}

const glyphTextures: THREE.Texture[] = [];
function glyphTexture(letter: number) {
	if (!glyphTextures[letter]) {
		const tex = texture("glyphs").clone();
		tex.repeat.set(1 / 26, 1);
		tex.offset.set(letter / 26, 0);
		tex.needsUpdate = true;
		glyphTextures[letter] = tex;
	}
	return glyphTextures[letter];
}

export interface EnchantingScene {
	root: THREE.Group;
	setShelves: (count: number) => void;
	setItem: (id: string) => void;
	/** advances the animation; `now` in milliseconds, `viewer` is where the book turns to */
	update: (now: number, viewer: THREE.Vector3, animate: boolean) => void;
	dispose: () => void;
}

const TICK = 50;

/** `onChange` is called when something arrived that changes the picture (textures, the item) */
export function buildScene(onChange: () => void): EnchantingScene {
	const root = new THREE.Group();
	loaded.add(onChange);

	const floorTex = texture("stone_bricks").clone();
	floorTex.wrapS = THREE.RepeatWrapping;
	floorTex.wrapT = THREE.RepeatWrapping;
	floorTex.repeat.set(7, 7);
	floorTex.needsUpdate = true;
	const floor = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), lambert(floorTex));
	floor.rotation.x = -Math.PI / 2;
	root.add(floor);

	root.add(block("enchanting_table_side", "enchanting_table_top", "enchanting_table_bottom", 0.75));

	const shelves = new THREE.Group();
	root.add(shelves);
	let shelfCount = -1;
	const setShelves = (count: number) => {
		if (count === shelfCount) return;
		shelfCount = count;
		shelves.clear();
		for (const [x, y, z] of SHELF_SPOTS.slice(0, count)) {
			const shelf = block("bookshelf", "oak_planks", "oak_planks");
			shelf.position.set(x, y, z);
			shelves.add(shelf);
		}
	};

	const book = buildBook();
	root.add(book.root);
	const state = new BookState();

	let item: THREE.Group | null = null;
	let itemId = "";
	const itemHolder = new THREE.Group();
	root.add(itemHolder);
	const setItem = (id: string) => {
		if (id === itemId) return;
		itemId = id;
		if (item) itemHolder.remove(item);
		item = itemMesh(id, onChange);
		item.scale.setScalar(0.5);
		itemHolder.add(item);
	};

	const glyphs: Glyph[] = [];
	const glyphGroup = new THREE.Group();
	root.add(glyphGroup);

	let lastTick = 0;
	let started = 0;
	const update = (now: number, viewer: THREE.Vector3, animate: boolean) => {
		if (!started) started = lastTick = now;
		const target = Math.atan2(viewer.z, viewer.x);
		if (!animate) {
			// a still picture: book open and facing the viewer, no glyphs
			state.open = state.oOpen = 1;
			state.rot = state.oRot = target;
			lastTick = now;
		}
		while (now - lastTick >= TICK) {
			lastTick += TICK;
			state.tick(target);
			// EnchantingTableBlock.animateTick: every shelf has a 1 in 16 chance to send a glyph
			for (const [x, y, z] of SHELF_SPOTS.slice(0, shelfCount)) {
				if (Math.floor(Math.random() * 16) !== 0) continue;
				const brightness = Math.random() * 0.6 + 0.4;
				const sprite = new THREE.Sprite(
					new THREE.SpriteMaterial({
						map: glyphTexture(Math.floor(Math.random() * 26)),
						color: new THREE.Color(brightness * 0.9, brightness * 0.9, brightness),
						transparent: true,
						alphaTest: 0.1,
					}),
				);
				sprite.scale.setScalar(2 * 0.1 * (Math.random() * 0.5 + 0.2));
				glyphGroup.add(sprite);
				glyphs.push({
					sprite,
					start: new THREE.Vector3(0, 2, 0),
					velocity: new THREE.Vector3(
						x + Math.random() - 0.5,
						y - Math.random() - 1,
						z + Math.random() - 0.5,
					),
					age: 0,
					lifetime: Math.floor(Math.random() * 10) + 30,
				});
			}
			for (let i = glyphs.length - 1; i >= 0; i--) {
				const glyph = glyphs[i];
				if (glyph.age++ >= glyph.lifetime) {
					glyphGroup.remove(glyph.sprite);
					glyph.sprite.material.dispose();
					glyphs.splice(i, 1);
				}
			}
		}
		const partial = animate ? (now - lastTick) / TICK : 0;
		const lerp = (a: number, b: number) => a + (b - a) * partial;

		// EnchantTableRenderer: 0.75 up, bobbing, turned to the viewer and tilted 80 degrees
		const time = state.time + partial;
		book.root.position.set(0, 0.75 + 0.1 + Math.sin(time * 0.1) * 0.01, 0);
		let turn = state.rot - state.oRot;
		while (turn >= Math.PI) turn -= Math.PI * 2;
		while (turn < -Math.PI) turn += Math.PI * 2;
		book.root.rotation.set(0, -(state.oRot + turn * partial), (80 * Math.PI) / 180, "YZX");
		const flip = lerp(state.oFlip, state.flip);
		const open = lerp(state.oOpen, state.open);
		poseBook(
			book,
			(Math.sin(time * 0.02) * 0.1 + 1.25) * open,
			clamp01(frac(flip + 0.25) * 1.6 - 0.3),
			clamp01(frac(flip + 0.75) * 1.6 - 0.3),
		);

		for (const glyph of glyphs) {
			// FlyTowardsPositionParticle.tick: from out by the shelf in to the book, dipping on arrival
			let f = (glyph.age + partial) / glyph.lifetime;
			f = 1 - f;
			let g = 1 - f;
			g *= g;
			g *= g;
			glyph.sprite.position.set(
				glyph.start.x + glyph.velocity.x * f,
				glyph.start.y + glyph.velocity.y * f - g * 1.2,
				glyph.start.z + glyph.velocity.z * f,
			);
		}

		// the item floats and spins above the book, like a dropped item (ItemEntityRenderer)
		const seconds = (now - started) / 1000;
		const ticks = animate ? seconds * 20 : 0;
		itemHolder.position.set(0, 1.55 + Math.sin(ticks / 10) * 0.1, 0);
		itemHolder.rotation.y = animate ? ticks / 20 : -Math.PI / 5;
	};

	const dispose = () => {
		loaded.delete(onChange);
		root.traverse((object) => {
			if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
				object.geometry.dispose();
				for (const material of [object.material].flat()) material.dispose();
			}
		});
	};

	return { root, setShelves, setItem, update, dispose };
}
