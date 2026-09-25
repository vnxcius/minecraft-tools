/**
 * Titles, descriptions and headings of the pages in the other languages (English is in
 * src/lib/seo.ts). Plain TypeScript, the prerender script imports it through seo.ts.
 */
import type { Language } from "./current";

type PageText = { title: string; description: string; heading: string };

export const PAGE_TEXT: Record<Exclude<Language, "en">, Record<string, PageText>> = {
	"pt-BR": {
		"/": {
			title: "Ferramentas úteis para Minecraft: calculadoras, geradores e guias",
			description:
				"Ferramentas grátis de Minecraft no navegador: mapa da semente, trocas com aldeões, encantamentos, estandartes, enfeites de armadura, poções e calculadoras.",
			heading: "Ferramentas úteis para Minecraft",
		},
		"/tool/stack-calculator": {
			title: "Calculadora de Packs do Minecraft: packs, baús e shulkers",
			description:
				"Converta qualquer quantidade de itens em packs, baús duplos e caixas de shulker. Funciona com packs de 64 e de 16 itens.",
			heading: "Calculadora de Packs",
		},
		"/tool/item-checklist": {
			title: "Lista de Itens do Minecraft: monte sua lista de materiais",
			description:
				"Monte a lista de materiais com todos os itens do Minecraft, defina quantidades e marque o que já coletou, com o vídeo do tutorial da construção ao lado.",
			heading: "Lista de Itens",
		},
		"/tool/3d-armor-trim-viewer": {
			title: "Visualizador de Enfeites de Armadura do Minecraft em 3D",
			description:
				"Veja todos os padrões e materiais de enfeite em todos os tipos de armadura, em 3D num suporte de armaduras. Gire, aproxime e escolha o visual antes de forjar.",
			heading: "Visualizador de Enfeites em 3D",
		},
		"/tool/banner-generator": {
			title: "Gerador de Estandartes do Minecraft: todos os padrões e receitas",
			description:
				"Crie estandartes com as 16 cores e os 42 padrões. Veja os materiais, as etapas no tear e obtenha um comando /give.",
			heading: "Gerador de Estandartes",
		},
		"/tool/shield-generator": {
			title: "Gerador de Escudos do Minecraft: estandartes em escudos",
			description:
				"Veja qualquer padrão de estandarte num escudo antes de fabricá-lo. Obtenha a lista de materiais e um comando /give do seu escudo.",
			heading: "Gerador de Escudos",
		},
		"/tool/firework-generator": {
			title: "Gerador de Fogos de Artifício do Minecraft: foguetes e estrelas",
			description:
				"Crie estrelas de fogo de artifício com todos os formatos, cores, explosões, feixes de luz e cintilação, veja a explosão e obtenha a receita e o comando /give.",
			heading: "Gerador de Fogos de Artifício",
		},
		"/tool/potion-maker": {
			title: "Preparo de Poções do Minecraft: receitas e durações",
			description:
				"Todas as receitas de poções do Minecraft passo a passo: ingredientes, versões prolongadas e fortalecidas, arremessáveis, persistentes e flechas com efeito.",
			heading: "Preparo de Poções",
		},
		"/tool/best-enchantments": {
			title: "Melhores Encantamentos do Minecraft para armaduras e ferramentas",
			description:
				"Os melhores encantamentos para cada peça de armadura, ferramenta e arma do Minecraft, como Proteção IV, Inquebrável III e Remendo, com um comando /give.",
			heading: "Melhores Encantamentos",
		},
		"/tool/seed-map": {
			title: "Mapa da Semente do Minecraft: biomas, vilas e estruturas",
			description:
				"Explore qualquer semente do Minecraft: biomas, vilas, fortalezas, chunks de slime e estruturas do Nether e do End. Destaque biomas e ache o mais próximo.",
			heading: "Mapa da Semente",
		},
		"/tool/enchant-order": {
			title: "Ordem de Encantamentos do Minecraft: a mais barata na bigorna",
			description:
				'Descubra a ordem mais barata para combinar livros encantados na bigorna e evitar o "Muito caro!". Custo em níveis de cada etapa, para cada item.',
			heading: "Ordem de Encantamentos",
		},
		"/tool/enchanting-table": {
			title: "Mesa de Encantamentos do Minecraft: chance de cada encantamento",
			description:
				"A chance exata de cada encantamento na mesa de encantamentos, por item, estantes, espaço e nível, em cada versão da Java Edition desde a 1.14.4.",
			heading: "Probabilidades da Mesa de Encantamentos",
		},
		"/tool/villager-trading": {
			title: "Trocas com Aldeões do Minecraft: todas as trocas por profissão",
			description:
				"Todas as trocas dos aldeões e do mercador ambulante por profissão e nível, preços de livros encantados do bibliotecário e uma busca de quem vende o quê.",
			heading: "Guia de Trocas com Aldeões",
		},
		"/tool/nether-portal": {
			title: "Calculadora de Portais do Nether do Minecraft",
			description:
				"Converta coordenadas da Superfície para o Nether e vice-versa para ligar portais. Divida por 8 ao entrar e multiplique por 8 ao sair.",
			heading: "Calculadora de Portais do Nether",
		},
		"/tool/slime-chunk-finder": {
			title: "Localizador de Chunks de Slime do Minecraft para qualquer semente",
			description:
				"Encontre os chunks de slime de qualquer semente do Minecraft num mapa, com as coordenadas, para montar uma fazenda de slime. Roda no navegador.",
			heading: "Localizador de Chunks de Slime",
		},
		"/tool/circle-generator": {
			title: "Gerador de Círculos do Minecraft: ovais, esferas e cúpulas",
			description:
				"Círculos, ovais, esferas e cúpulas pixelados para construções no Minecraft, camada por camada, com a quantidade exata de blocos.",
			heading: "Gerador de Círculos",
		},
	},
	es: {
		"/": {
			title: "Herramientas para Minecraft: calculadoras, generadores y guías",
			description:
				"Herramientas gratis de Minecraft en tu navegador: mapa de semillas, comercio con aldeanos, encantamientos, estandartes, diseños de armadura, pociones y más.",
			heading: "Herramientas útiles para Minecraft",
		},
		"/tool/stack-calculator": {
			title: "Calculadora de pilas de Minecraft: pilas, cofres y shulkers",
			description:
				"Convierte cualquier cantidad de objetos en pilas, cofres dobles y cajas de shulker. Funciona con pilas de 64 y de 16 objetos.",
			heading: "Calculadora de pilas",
		},
		"/tool/item-checklist": {
			title: "Lista de objetos de Minecraft: crea tu lista de materiales",
			description:
				"Crea la lista de materiales con todos los objetos de Minecraft, fija cantidades y márcalos al conseguirlos, con el vídeo del tutorial al lado.",
			heading: "Lista de objetos",
		},
		"/tool/3d-armor-trim-viewer": {
			title: "Visor de diseños de armadura de Minecraft en 3D",
			description:
				"Mira todos los diseños y materiales de armadura en cada tipo de armadura, en 3D sobre un soporte para armadura. Gíralo, acércalo y elige antes de forjar.",
			heading: "Visor de diseños de armadura en 3D",
		},
		"/tool/banner-generator": {
			title: "Generador de estandartes de Minecraft: patrones y recetas",
			description:
				"Diseña estandartes con los 16 colores y los 42 patrones. Consulta los materiales, los pasos en el telar y obtén un comando /give.",
			heading: "Generador de estandartes",
		},
		"/tool/shield-generator": {
			title: "Generador de escudos de Minecraft: estandartes en escudos",
			description:
				"Mira cualquier patrón de estandarte en un escudo antes de fabricarlo. Obtén la lista de materiales y un comando /give de tu escudo.",
			heading: "Generador de escudos",
		},
		"/tool/firework-generator": {
			title: "Generador de fuegos artificiales de Minecraft: cohetes y estrellas",
			description:
				"Diseña estrellas de fuegos artificiales con todas las formas, colores, rastros y centelleos, mira cómo explotan y obtén la receta y el comando /give.",
			heading: "Generador de fuegos artificiales",
		},
		"/tool/potion-maker": {
			title: "Elaboración de pociones de Minecraft: recetas y duraciones",
			description:
				"Todas las recetas de pociones de Minecraft paso a paso: ingredientes, versiones prolongadas y potenciadas, arrojadizas, persistentes y flechas con efecto.",
			heading: "Elaboración de pociones",
		},
		"/tool/best-enchantments": {
			title: "Mejores encantamientos de Minecraft para armaduras y herramientas",
			description:
				"Los mejores encantamientos para cada armadura, herramienta y arma de Minecraft, como Protección IV, Irrompibilidad III y Reparación, con comando /give.",
			heading: "Mejores encantamientos",
		},
		"/tool/seed-map": {
			title: "Mapa de semillas de Minecraft: biomas, aldeas y estructuras",
			description:
				"Explora cualquier semilla de Minecraft: biomas, aldeas, fortalezas, chunks de slime y estructuras del Nether y del End. Resalta biomas y halla el más cercano.",
			heading: "Mapa de semillas",
		},
		"/tool/enchant-order": {
			title: "Orden de encantamientos de Minecraft: el más barato en el yunque",
			description:
				'Descubre el orden más barato para combinar libros encantados en el yunque y evitar el "¡Demasiado caro!". Coste en niveles de cada paso, para cada objeto.',
			heading: "Orden de encantamientos",
		},
		"/tool/enchanting-table": {
			title: "Mesa de encantamientos de Minecraft: probabilidad de encantar",
			description:
				"La probabilidad exacta de cada encantamiento en la mesa de encantamientos por objeto, librerías, ranura y nivel, en cada versión de Java Edition desde 1.14.4.",
			heading: "Probabilidades de la mesa de encantamientos",
		},
		"/tool/villager-trading": {
			title: "Comercio con aldeanos de Minecraft: todos los tratos por profesión",
			description:
				"Todos los comercios de aldeanos y del vendedor ambulante por profesión y nivel, precios de libros encantados del bibliotecario y un buscador de quién vende qué.",
			heading: "Guía de comercio con aldeanos",
		},
		"/tool/nether-portal": {
			title: "Calculadora de portales del Nether de Minecraft",
			description:
				"Convierte coordenadas del mundo superior al Nether y al revés para enlazar portales. Divide entre 8 al entrar y multiplica por 8 al salir.",
			heading: "Calculadora de portales del Nether",
		},
		"/tool/slime-chunk-finder": {
			title: "Buscador de chunks de slime de Minecraft para cualquier semilla",
			description:
				"Encuentra los chunks de slime de cualquier semilla de Minecraft en un mapa, con sus coordenadas, para construir una granja de slimes. Funciona en tu navegador.",
			heading: "Buscador de chunks de slime",
		},
		"/tool/circle-generator": {
			title: "Generador de círculos de Minecraft: óvalos, esferas y cúpulas",
			description:
				"Círculos, óvalos, esferas y cúpulas pixelados para construcciones en Minecraft, capa por capa, con la cantidad exacta de bloques.",
			heading: "Generador de círculos",
		},
	},
};
