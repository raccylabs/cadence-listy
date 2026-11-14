// What can go behind an advent door, and what fills a day nobody set up.
export const DOOR_KINDS = [
	['note', 'Message'],
	['coupon', 'Coupon'],
	['riddle', 'Riddle'],
	['clue', 'Scavenger hunt clue'],
	['activity', 'Family activity']
];
export const REACTIONS = [
	['heart', '❤️'],
	['laugh', '😂'],
	['star', '⭐']
];
export const FINALE = 25;

/** Built-in surprises for days left empty. */
export const FILLERS = [
	['riddle', 'What do snowmen eat for breakfast?', 'Frosted Flakes!'],
	['note', 'Reindeer hooves change for winter: the pads shrink and hair grows around them, so they grip snow and ice like snow boots.', ''],
	['riddle', 'What do you call an elf who sings?', 'A wrapper.'],
	['riddle', 'Why was the snowman looking through the carrots?', 'He was picking his nose.'],
	['note', 'Some of the first artificial Christmas trees were made in Germany from goose feathers dyed green.', ''],
	['riddle', 'What did the gingerbread man put on his bed?', 'A cookie sheet.'],
	['riddle', 'How do you know Santa is good at karate?', 'He has a black belt.'],
	['note', 'Candy canes were plain white for a long time. The red stripes only showed up around 1900.', ''],
	['riddle', 'What do you call a cat on the beach at Christmas?', 'Sandy Claws.'],
	['riddle', 'What falls at the North Pole but never gets hurt?', 'Snow.'],
	['note', 'Snowflakes come in endless shapes, but almost all of them have six sides.', ''],
	['riddle', "Why did Santa's helper go to the doctor?", 'He had low elf-esteem.'],
	['riddle', 'What do elves learn in school?', 'The elf-abet.'],
	['note', 'Rudolph the Red-Nosed Reindeer first appeared in 1939, in a free story book handed out by a department store.', ''],
	['riddle', 'What did one snowman say to the other?', 'Do you smell carrots?'],
	['riddle', 'What do you get if you cross a bell and a skunk?', 'Jingle smells.'],
	['note', 'In Norway, an old Christmas Eve tradition is to hide all the brooms so witches can’t ride them.', ''],
	['riddle', 'What kind of photos do elves take?', 'Elf-ies.'],
	['riddle', 'Why is it so cold at Christmas?', "Because it's in Decembrrrr."],
	['note', 'The tallest snow person ever built stood over 120 feet tall, in Bethel, Maine, in 2008. Her name was Olympia.', ''],
	['riddle', 'What does Santa do in his garden?', 'Hoe, hoe, hoe!'],
	['riddle', 'What do you call Santa when he stops moving?', 'Santa Pause.'],
	['activity', 'Make paper snowflakes and tape them to a window.', ''],
	['activity', 'Put on pajamas, make hot cocoa and go see the Christmas lights.', ''],
	['note', 'Merry Christmas! You opened every door.', '']
];

/** A video or song link that can play right on the door. */
export function embedFor(link) {
	let u;
	try {
		u = new URL(link);
	} catch {
		return null;
	}
	const host = u.hostname.replace(/^www\.|^m\./, '');
	let id = '';
	if (host === 'youtu.be') id = u.pathname.slice(1);
	else if (host === 'youtube.com') id = u.searchParams.get('v') || (u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]+)/) ?? [])[1] || '';
	if (/^[\w-]{6,20}$/.test(id)) return { src: `https://www.youtube-nocookie.com/embed/${id}`, tall: false };
	const sp = host === 'open.spotify.com' && u.pathname.match(/^\/(?:intl-\w+\/)?(track|album|playlist|episode)\/(\w+)/);
	if (sp) return { src: `https://open.spotify.com/embed/${sp[1]}/${sp[2]}`, tall: sp[1] !== 'track' };
	return null;
}
