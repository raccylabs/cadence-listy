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
		decor: [
			{ id: 'lights', label: 'Christmas lights', on: true, modes: [['twinkle', 'Twinkle'], ['chase', 'Chase'], ['steady', 'Steady']] },
			{ id: 'snow', label: 'Falling snow', on: false },
			{ id: 'stripes', label: 'Candy-cane stripe', on: true }
		],
		widgets: [
			{ id: 'countdown', label: 'Days until Christmas', on: true },
			{ id: 'spotlight', label: 'Show my top pick first', on: true },
			{ id: 'advent', label: 'Advent calendar', on: false }
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
		decor: [
			{ id: 'bunting', label: 'String of pennants', on: true },
			{ id: 'confetti', label: 'Falling confetti', on: false },
			{ id: 'stripes', label: 'Color stripe', on: true }
		],
		widgets: [
			{ id: 'countdown', label: 'Days until the big day', on: true },
			{ id: 'spotlight', label: 'Show my top pick first', on: true }
		]
	}
};

export const EDITION_LIST = Object.values(EDITIONS);
