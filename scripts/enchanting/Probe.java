package probe;
import java.lang.reflect.*;
import java.nio.file.*;
import java.util.*;

/**
 * Asks a Minecraft server jar for its enchanting facts, calling the game's own code.
 * Names are Mojang's; with a mappings file they are translated to the obfuscated ones.
 *
 *   java -cp <server classpath>:. Probe <mappings.txt|-> <out.json> <mode: full|items>
 */
public class Probe {
	static final Map<String, String> CLS = new HashMap<>(); // mojang -> obf
	static final Map<String, List<String[]>> METHODS = new HashMap<>(); // class -> {ret, name, params, obf}
	static final Map<String, Map<String, String>> FIELDS = new HashMap<>();
	static boolean mapped;

	static void loadMappings(String path) throws Exception {
		String current = null;
		for (String line : Files.readAllLines(Path.of(path))) {
			if (line.startsWith("#") || line.isBlank()) continue;
			if (!line.startsWith(" ")) {
				String[] p = line.substring(0, line.length() - 1).split(" -> ");
				current = p[0];
				CLS.put(p[0], p[1]);
				continue;
			}
			String[] p = line.trim().split(" -> ");
			String left = p[0].replaceAll("^\\d+:\\d+:", "");
			if (left.contains("(")) {
				String[] rn = left.substring(0, left.indexOf('(')).split(" ");
				String params = left.substring(left.indexOf('(') + 1, left.indexOf(')'));
				METHODS.computeIfAbsent(current, k -> new ArrayList<>()).add(new String[] {rn[0], rn[1], params, p[1]});
			} else {
				String[] tn = left.split(" ");
				FIELDS.computeIfAbsent(current, k -> new HashMap<>()).put(tn[1], p[1]);
			}
		}
	}

	static Class<?> cls(String name) throws Exception {
		switch (name) {
			case "int": return int.class;
			case "boolean": return boolean.class;
			case "float": return float.class;
			case "long": return long.class;
			case "double": return double.class;
			case "void": return void.class;
		}
		if (name.endsWith("[]")) return java.lang.reflect.Array.newInstance(cls(name.substring(0, name.length() - 2)), 0).getClass();
		return Class.forName(mapped ? CLS.getOrDefault(name, name) : name);
	}

	static boolean has(String owner) {
		try { cls(owner); return true; } catch (Throwable e) { return false; }
	}

	/** overloads of a method named `name` declared by `owner`, as reflection objects */
	static List<Method> methods(String owner, String name) throws Exception {
		List<Method> out = new ArrayList<>();
		Class<?> c = cls(owner);
		if (!mapped) {
			for (Method m : c.getDeclaredMethods()) if (m.getName().equals(name)) { m.setAccessible(true); out.add(m); }
			return out;
		}
		for (String[] m : METHODS.getOrDefault(owner, List.of())) {
			if (!m[1].equals(name)) continue;
			List<Class<?>> params = new ArrayList<>();
			if (!m[2].isEmpty()) for (String t : m[2].split(",")) params.add(cls(t));
			try {
				Method r = c.getDeclaredMethod(m[3], params.toArray(new Class<?>[0]));
				r.setAccessible(true);
				out.add(r);
			} catch (NoSuchMethodException e) { /* bridge or synthetic */ }
		}
		return out;
	}

	/** method `name` found on the class of `target` or its superclasses (by mojang name) */
	static Method method(Object target, String owner, String name, int params) throws Exception {
		for (Method m : methods(owner, name)) if (m.getParameterCount() == params) return m;
		throw new NoSuchMethodException(owner + "." + name + "/" + params);
	}

	static Object call(Object target, String owner, String name, Object... args) throws Exception {
		return method(target, owner, name, args.length).invoke(target, args);
	}

	static Object field(String owner, String name, Object target) throws Exception {
		String obf = mapped ? FIELDS.getOrDefault(owner, Map.of()).getOrDefault(name, name) : name;
		Field f = cls(owner).getDeclaredField(obf);
		f.setAccessible(true);
		return f.get(target);
	}

	static Object registry(String name) throws Exception {
		if (has("net.minecraft.core.registries.BuiltInRegistries")) return field("net.minecraft.core.registries.BuiltInRegistries", name, null);
		return field("net.minecraft.core.Registry", name, null);
	}

	static String key(Object registry, Object value) throws Exception {
		String owner = has("net.minecraft.core.registries.BuiltInRegistries") ? "net.minecraft.core.Registry" : "net.minecraft.core.Registry";
		for (Method m : methods(owner, "getKey")) {
			if (m.getParameterCount() == 1 && m.getParameterTypes()[0] == Object.class) return String.valueOf(m.invoke(registry, value));
		}
		// interface methods live on the interface in newer versions
		Method m = method(registry, "net.minecraft.core.Registry", "getKey", 1);
		return String.valueOf(m.invoke(registry, value));
	}

	static List<Object> list(Object iterable) {
		List<Object> out = new ArrayList<>();
		for (Object o : (Iterable<?>) iterable) out.add(o);
		return out;
	}

	static String q(String s) { return "\"" + s.replace("\"", "\\\"") + "\""; }

	static Object featureFlags() throws Exception {
		String owner = "net.minecraft.world.flag.FeatureFlags";
		for (String f : new String[] {"DEFAULT_FLAGS", "VANILLA_SET"}) {
			try { return field(owner, f, null); } catch (Exception ignored) {}
		}
		throw new Exception("no feature flags");
	}

	/** fills arguments of a game method by their types */
	static Object[] args(Method m, Map<Class<?>, Object> byType, int cost) throws Exception {
		Class<?>[] types = m.getParameterTypes();
		Object[] out = new Object[types.length];
		for (int i = 0; i < types.length; i++) {
			if (types[i] == int.class) out[i] = cost;
			else if (types[i] == boolean.class) out[i] = false;
			else {
				Object v = null;
				for (Map.Entry<Class<?>, Object> e : byType.entrySet()) if (types[i].isAssignableFrom(e.getKey())) v = e.getValue();
				if (v == null) throw new Exception("no argument for " + types[i]);
				out[i] = v;
			}
		}
		return out;
	}

	public static void main(String[] a) throws Exception {
		if (!a[0].equals("-")) { loadMappings(a[0]); mapped = true; }
		boolean full = a[2].equals("full");
		try { call(null, "net.minecraft.SharedConstants", "tryDetectVersion"); } catch (Throwable ignored) {}
		call(null, "net.minecraft.server.Bootstrap", "bootStrap");

		StringBuilder out = new StringBuilder("{\n");
		Object enchReg = full ? registry("ENCHANTMENT") : null;
		Object itemReg = registry("ITEM");
		String E = "net.minecraft.world.item.enchantment.Enchantment";
		String I = "net.minecraft.world.item.Item";
		String S = "net.minecraft.world.item.ItemStack";
		String H = "net.minecraft.world.item.enchantment.EnchantmentHelper";

		List<Object> enchantments = full ? list(enchReg) : List.of();
		Map<Object, String> enchId = new HashMap<>();
		if (full) {
			out.append("\"enchantments\": {\n");
			for (int i = 0; i < enchantments.size(); i++) {
				Object e = enchantments.get(i);
				String id = key(enchReg, e);
				enchId.put(e, id);
				int max = (int) call(e, E, "getMaxLevel");
				int min = (int) call(e, E, "getMinLevel");
				int weight;
				try { weight = (int) call(call(e, E, "getRarity"), E + "$Rarity", "getWeight"); }
				catch (NoSuchMethodException ex) { weight = (int) call(e, E, "getWeight"); }
				boolean treasure = (boolean) call(e, E, "isTreasureOnly");
				boolean discoverable = true;
				try { discoverable = (boolean) call(e, E, "isDiscoverable"); } catch (NoSuchMethodException ignored) {}
				StringBuilder costs = new StringBuilder();
				for (int l = min; l <= max; l++) {
					if (costs.length() > 0) costs.append(",");
					costs.append("[").append(call(e, E, "getMinCost", l)).append(",").append(call(e, E, "getMaxCost", l)).append("]");
				}
				StringBuilder incompatible = new StringBuilder();
				for (Object o : enchantments) {
					if (o == e) continue;
					if (!(boolean) call(e, E, "isCompatibleWith", o)) {
						if (incompatible.length() > 0) incompatible.append(",");
						incompatible.append(q(key(enchReg, o)));
					}
				}
				// 1.20.5 and 1.20.6: the items come from tags named in the definition
				String tags = "";
				try {
					Object def = field(E, "definition", e);
					String D = E + "$EnchantmentDefinition";
					Object supported = call(def, D, "supportedItems");
					Optional<?> primary = (Optional<?>) call(def, D, "primaryItems");
					tags = ", \"supported\": " + q(String.valueOf(call(supported, "net.minecraft.tags.TagKey", "location")))
						+ (primary.isPresent() ? ", \"primary\": " + q(String.valueOf(call(primary.get(), "net.minecraft.tags.TagKey", "location"))) : "");
				} catch (NoSuchFieldException | ClassNotFoundException ignored) {}
				out.append(q(id)).append(": {\"weight\": ").append(weight).append(tags).append(", \"minLevel\": ").append(min)
					.append(", \"treasure\": ").append(treasure).append(", \"discoverable\": ").append(discoverable)
					.append(", \"costs\": [").append(costs).append("], \"incompatible\": [").append(incompatible).append("]}")
					.append(i < enchantments.size() - 1 ? ",\n" : "\n");
			}
			out.append("},\n");
		}

		Class<?> itemLike = cls("net.minecraft.world.level.ItemLike");
		Constructor<?> stackOf = cls(S).getDeclaredConstructor(itemLike);
		Map<Class<?>, Object> byType = new HashMap<>();
		try { byType.put(featureFlags().getClass(), featureFlags()); } catch (Exception ignored) {}
		Method available = null;
		Method select = null;
		if (full) {
			for (Method m : methods(H, "getAvailableEnchantmentResults")) available = m;
			for (Method m : methods(H, "selectEnchantment")) if (select == null || m.getParameterCount() >= select.getParameterCount()) select = m;
		}

		out.append("\"items\": {\n");
		boolean first = true;
		for (Object item : list(itemReg)) {
			String id = key(itemReg, item);
			Object stack = stackOf.newInstance(item);
			int value = 0;
			try { value = (int) call(item, I, "getEnchantmentValue"); }
			catch (NoSuchMethodException ex) {
				Object type = field("net.minecraft.core.component.DataComponents", "ENCHANTABLE", null);
				Object ench = null;
				List<Method> getters = new ArrayList<>(methods(S, "get"));
				if (has("net.minecraft.core.component.DataComponentHolder")) getters.addAll(methods("net.minecraft.core.component.DataComponentHolder", "get"));
				for (Method m : getters) if (m.getParameterCount() == 1 && ench == null) ench = m.invoke(stack, type);
				if (ench != null) value = (int) call(ench, "net.minecraft.world.item.enchantment.Enchantable", "value");
			}
			boolean enchantable;
			// 1.21.2 moved it from the item to the stack
			try { enchantable = (boolean) call(item, I, "isEnchantable", stack); }
			catch (NoSuchMethodException ex) { enchantable = (boolean) call(stack, S, "isEnchantable"); }
			if (value <= 0 && !id.equals("minecraft:book")) continue;
			out.append(first ? "" : ",\n").append(q(id)).append(": {\"enchantability\": ").append(value).append(", \"enchantable\": ").append(enchantable);
			first = false;
			if (full) {
				byType.put(stack.getClass(), stack);
				// every cost the table can reach and more: the candidates the game offers at each
				out.append(", \"available\": [");
				for (int cost = 1; cost <= 80; cost++) {
					List<?> results = (List<?>) available.invoke(null, args(available, byType, cost));
					out.append(cost > 1 ? "," : "").append("[");
					for (int r = 0; r < results.size(); r++) {
						Object inst = results.get(r);
						Object ench = field("net.minecraft.world.item.enchantment.EnchantmentInstance", "enchantment", inst);
						int level = (int) field("net.minecraft.world.item.enchantment.EnchantmentInstance", "level", inst);
						out.append(r > 0 ? "," : "").append(q(enchId.get(ench) + " " + level));
					}
					out.append("]");
				}
				out.append("]");
			}
			out.append("}");
		}
		out.append("\n}");

		// the game's own selection, many times, to check the calculator against
		if (full && a.length > 3) {
			Object random = has("net.minecraft.util.RandomSource") ? call(null, "net.minecraft.util.RandomSource", "create", 1234L) : new Random(1234);
			byType.put(random.getClass(), random);
			out.append(",\n\"samples\": {\n");
			String[] cases = a[3].split(";");
			for (int c = 0; c < cases.length; c++) {
				String[] parts = cases[c].split("@");
				Object item = null;
				for (Object it : list(itemReg)) if (key(itemReg, it).equals(parts[0])) item = it;
				int cost = Integer.parseInt(parts[1]);
				Object stack = stackOf.newInstance(item);
				byType.put(stack.getClass(), stack);
				Map<String, Integer> counts = new TreeMap<>();
				int n = 200000;
				for (int i = 0; i < n; i++) {
					List<?> picked = (List<?>) select.invoke(null, args(select, byType, cost));
					counts.merge("#" + picked.size(), 1, Integer::sum);
					for (Object inst : picked) {
						Object ench = field("net.minecraft.world.item.enchantment.EnchantmentInstance", "enchantment", inst);
						int level = (int) field("net.minecraft.world.item.enchantment.EnchantmentInstance", "level", inst);
						counts.merge(enchId.get(ench) + " " + level, 1, Integer::sum);
					}
				}
				out.append(q(cases[c])).append(": {\"n\": ").append(n);
				for (Map.Entry<String, Integer> e : counts.entrySet()) out.append(", ").append(q(e.getKey())).append(": ").append(e.getValue());
				out.append("}").append(c < cases.length - 1 ? ",\n" : "\n");
			}
			out.append("}");
		}
		out.append("\n}\n");
		Files.writeString(Path.of(a[1]), out.toString());
		System.out.println("wrote " + a[1]);
		System.exit(0);
	}
}
