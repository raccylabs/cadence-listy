// Each edition is a themed wish list. To release a new one:
//   1. add an entry here,
//   2. add its colors and type in editions/themes.css (a [data-edition='id'] block) and import its fonts there,
//   3. draw anything new for its `decor` ids in editions/Decor.svelte.
// `date` is the fixed yearly day, or null when the owner picks it.

export const EDITIONS = {
	christmas: {
		id: 'christmas',
		name: 'Christmas',
		blurb: 'Bold colors, candy-striped ornaments and a countdown to Christmas.',
		date: { month: 12, day: 25 },
		listName: 'Christmas Wish List',
		eventName: 'Christmas',
		eventDay: 'Merry Christmas!',
		tiers: ['Top of the list', 'Would love', 'Stocking stuffers'],
		spots: ['gift', 'stocking', 'cane', 'mug', 'tree', 'snowman'],
		countdownSpot: 'tree',
		scenes: [['ornaments', 'Ornaments'], ['snowman', 'Snowman'], ['gingerbread', 'Gingerbread man'], ['tree', 'Christmas tree']],
		decor: [
			{ id: 'lights', label: 'Christmas lights', on: true, modes: [['twinkle', 'Twinkle'], ['chase', 'Chase'], ['steady', 'Steady']] },
			{ id: 'snow', label: 'Falling snow', on: true },
			{ id: 'stripes', label: 'Candy-cane stripe', on: true }
		],
		widgets: [
			{ id: 'countdown', label: 'Days until Christmas', on: true },
			{ id: 'spotlight', label: 'Show top picks first', on: true },
		]
	},
	birthday: {
		id: 'birthday',
		name: 'Birthday',
		blurb: 'Bold colors, balloons and a countdown to your big day.',
		date: null,
		listName: 'Birthday Wish List',
		eventName: 'the big day',
		eventDay: 'Happy birthday!',
		tiers: ['Top of the list', 'Would love', 'Little extras'],
		spots: ['gift', 'cake', 'balloon', 'hat'],
		countdownSpot: 'cake',
		scenes: [['balloons', 'Balloons'], ['cake', 'Birthday cake'], ['present', 'Present']],
		decor: [
			{ id: 'bunting', label: 'String of pennants', on: true },
			{ id: 'confetti', label: 'Falling confetti', on: true },
			{ id: 'stripes', label: 'Sprinkle stripe', on: true }
		],
		widgets: [
			{ id: 'countdown', label: 'Days until the big day', on: true },
			{ id: 'spotlight', label: 'Show top picks first', on: true }
		]
	}
};

export const EDITION_LIST = Object.values(EDITIONS);

/** The header drawing to use: the saved one if this edition has it, otherwise its first. */
export const sceneFor = (edition, saved) => {
	const scenes = EDITIONS[edition]?.scenes ?? [];
	return scenes.some(([id]) => id === saved) ? saved : scenes[0]?.[0];
};

// Top-pick banners. Each item can pick its own words, color and pattern.
export const PICK_COLORS = [
	['red', 'Red', '#e2574c'],
	['green', 'Green', '#4f9f7d'],
	['gold', 'Gold', '#f5c451'],
	['pink', 'Pink', '#ef8fb0'],
	['purple', 'Purple', '#9b7fd1'],
	['blue', 'Blue', '#5b9bd5'],
	['cocoa', 'Cocoa', '#3b2a25']
];
export const PICK_PATTERNS = [
	['plain', 'Plain'],
	['stripes', 'Candy stripes'],
	['dots', 'Polka dots'],
	['sprinkles', 'Sprinkles'],
	['stars', 'Stars']
];
export const PICK_TEXT = 'Top pick';

