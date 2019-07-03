import { DefaultGameOptions } from "../room-game";
import { Room } from "../rooms";
import { IGameFile } from "../types/games";
import { commandDescriptions, commands as templateCommands, Guessing, GuessingAbstract } from './templates/guessing';

const data: Dict<Dict<string[]>> = {
	"Characters": {},
	"Pokemon": {},
	"Pokemon Abilities": {},
	"Pokemon Items": {},
	"Pokemon Moves": {},
};
const categories: string[] = Object.keys(data);
const dataKeys: Dict<string[]> = {};
let loadedData = false;

class EkansEdges extends Guessing implements GuessingAbstract {
	static loadData(room: Room) {
		if (loadedData) return;
		room.say("Loading game-specific data...");

		for (let i = 0; i < Dex.data.characters.length; i++) {
			const edge = Dex.data.characters[i].charAt(0) + " - " + Dex.data.characters[i].substr(-1);
			if (!data["Characters"][edge]) data["Characters"][edge] = [];
			data["Characters"][edge].push(Dex.data.characters[i]);
		}

		const pokemon = Dex.getPokemonList();
		for (let i = 0; i < pokemon.length; i++) {
			const edge = pokemon[i].species.charAt(0) + " - " + pokemon[i].species.substr(-1);
			if (!data["Pokemon"][edge]) data["Pokemon"][edge] = [];
			data["Pokemon"][edge].push(pokemon[i].species);
		}

		const abilities = Dex.getAbilitiesList();
		for (let i = 0; i < abilities.length; i++) {
			const edge = abilities[i].name.charAt(0) + " - " + abilities[i].name.substr(-1);
			if (!data["Pokemon Abilities"][edge]) data["Pokemon Abilities"][edge] = [];
			data["Pokemon Abilities"][edge].push(abilities[i].name);
		}

		const items = Dex.getItemsList();
		for (let i = 0; i < items.length; i++) {
			const edge = items[i].name.charAt(0) + " - " + items[i].name.substr(-1);
			if (!data["Pokemon Items"][edge]) data["Pokemon Items"][edge] = [];
			data["Pokemon Items"][edge].push(items[i].name);
		}

		const moves = Dex.getMovesList();
		for (let i = 0; i < moves.length; i++) {
			const edge = moves[i].name.charAt(0) + " - " + moves[i].name.substr(-1);
			if (!data["Pokemon Moves"][edge]) data["Pokemon Moves"][edge] = [];
			data["Pokemon Moves"][edge].push(moves[i].name);
		}

		for (const i in data) {
			dataKeys[i] = Object.keys(data[i]);
		}

		loadedData = true;
	}

	defaultOptions: DefaultGameOptions[] = ['points'];
	lastEdge: string = '';

	onSignups() {
		if (this.isMiniGame) {
			this.nextRound();
		} else {
			if (this.options.freejoin) this.timeout = setTimeout(() => this.nextRound(), 5000);
		}
	}

	setAnswers() {
		const category = this.roundCategory || this.variant || Tools.sampleOne(categories);
		let edge = Tools.sampleOne(dataKeys[category]);
		while (edge === this.lastEdge) {
			edge = Tools.sampleOne(dataKeys[category]);
		}
		this.answers = [edge];
		this.hint = "[**" + category + "**] " + edge;
	}

	onNextRound() {
		this.canGuess = false;
		this.setAnswers();
		this.on(this.hint, () => {
			this.canGuess = true;
			this.timeout = setTimeout(() => {
				if (this.answers.length) {
					this.say("Time's up! " + this.getAnswers());
					this.answers = [];
					if (this.isMiniGame) {
						this.end();
						return;
					}
				}
				this.nextRound();
			}, 10 * 1000);
		});
		this.say(this.hint);
	}
}

export const game: IGameFile<EkansEdges> = {
	aliases: ['ekans'],
	battleFrontierCategory: 'Identification',
	class: EkansEdges,
	commandDescriptions,
	commands: Object.assign({}, templateCommands),
	description: "Players guess answers that have the given starting and ending letters!",
	formerNames: ["Edges"],
	freejoin: true,
	name: "Ekans' Edges",
	mascot: "Ekans",
	minigameCommand: 'edge',
	minigameDescription: "Use ``.g`` to guess an answer with the given starting and ending letters!",
	modes: ["survival"],
	variants: [
		{
			name: "Ekans' Ability Edges",
			variant: "Pokemon Abilities",
			variantAliases: ['ability', 'abilities'],
		},
		{
			name: "Ekans' Item Edges",
			variant: "Pokemon Items",
			variantAliases: ['item', 'items'],
		},
		{
			name: "Ekans' Move Edges",
			variant: "Pokemon Moves",
			variantAliases: ['move', 'moves'],
		},
		{
			name: "Ekans' Pokemon Edges",
			variant: "Pokemon",
		},
	],
};
