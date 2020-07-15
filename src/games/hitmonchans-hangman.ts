import type { Player } from "../room-activity";
import type { Room } from "../rooms";
import type { IGameFile, IGameFormat } from "../types/games";
import type { User } from "../users";
import { game as guessingGame, Guessing } from "./templates/guessing";

const data: {'Characters': string[]; 'Locations': string[]; 'Pokemon': string[]; 'Pokemon Abilities': string[];
	'Pokemon Items': string[]; 'Pokemon Moves': string[];} = {
	"Characters": [],
	"Locations": [],
	"Pokemon": [],
	"Pokemon Abilities": [],
	"Pokemon Items": [],
	"Pokemon Moves": [],
};
type DataKey = keyof typeof data;
const categories = Object.keys(data) as DataKey[];

class HitmonchansHangman extends Guessing {
	allLetters: number = 0;
	answerTimeLimit: number = 15 * 1000;
	currentCategory: string = '';
	guessedLetters: string[] = [];
	guessLimit: number = 10;
	hints: string[] = [];
	incorrectGuessTime: number = 4000;
	lastAnswer: string = '';
	letters: string[] = [];
	roundGuesses = new Map<Player, boolean>();
	solvedLetters: string[] = [];

	static loadData(room: Room | User): void {
		data["Characters"] = Dex.data.characters.slice();
		data["Locations"] = Dex.data.locations.slice();
		data["Pokemon"] = Games.getPokemonList().map(x => x.name);
		data["Pokemon Abilities"] = Games.getAbilitiesList().map(x => x.name);
		data["Pokemon Items"] = Games.getItemsList().map(x => x.name);
		data["Pokemon Moves"] = Games.getMovesList().map(x => x.name);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async setAnswers(): Promise<void> {
		const category = (this.roundCategory || this.variant || this.sampleOne(categories)) as DataKey;
		this.currentCategory = category;
		let answer = this.sampleOne(data[category]);
		while (answer === this.lastAnswer) {
			answer = this.sampleOne(data[category]);
		}
		this.lastAnswer = answer;
		this.answers = [answer];
		this.solvedLetters = [];
		this.guessedLetters = [];
		const letters = answer.split("");
		this.letters = letters;
		const allLetters = Tools.toId(answer).split("");
		this.allLetters = allLetters.filter((value, pos) => allLetters.indexOf(value) === pos).length;
		this.hints = this.letters.slice();
		for (let i = 0; i < this.hints.length; i++) {
			this.hints[i] = Tools.toId(this.hints[i]).length ? "_" : this.hints[i] === ' ' ? "/" : this.hints[i];
		}
	}

	updateHint(): void {
		if (this.timeout) this.timeout = null;
		this.roundGuesses.clear();
		for (let i = 0; i < this.letters.length; i++) {
			if (this.solvedLetters.includes(Tools.toId(this.letters[i]))) this.hints[i] = this.letters[i];
		}
		this.hint = "<b>" + this.currentCategory + "</b> | " + this.hints.join(" ") + (this.guessedLetters.length ? " | " +
			this.guessedLetters.join(", ") : "");
	}

	onHintHtml(): void {
		if (this.guessedLetters.length >= this.guessLimit) {
			if (this.timeout) clearTimeout(this.timeout);
			this.say("All guesses have been used! The answer was __" + this.answers[0] + "__");
			if (this.isMiniGame) {
				this.end();
			} else {
				this.answers = [];
				this.timeout = setTimeout(() => this.nextRound(), 5000);
			}
		} else {
			if (!this.canGuess) this.canGuess = true;
			if (this.answerTimeLimit) {
				if (this.timeout) clearTimeout(this.timeout);
				this.timeout = setTimeout(() => this.onAnswerTimeLimit(), this.answerTimeLimit);
			}
		}
	}

	filterGuess(guess: string): boolean {
		guess = Tools.toId(guess);
		if (this.guessedLetters.includes(guess) || this.solvedLetters.includes(guess) ||
			guess.length > Tools.toId(this.answers[0]).length) return true;
		return false;
	}

	onIncorrectGuess(player: Player, guess: string): string {
		guess = Tools.toId(guess);
		if (!this.timeout) {
			this.timeout = setTimeout(() => this.nextRound(), this.incorrectGuessTime);
		}
		for (const letter of this.letters) {
			if (Tools.toId(letter) === guess) {
				if (!this.solvedLetters.includes(guess)) {
					this.solvedLetters.push(guess);
					if (this.solvedLetters.length === this.allLetters) return this.answers[0];
				}
				return '';
			}
		}
		this.guessedLetters.push(guess);
		return '';
	}
}

export const game: IGameFile<HitmonchansHangman> = Games.copyTemplateProperties(guessingGame, {
	aliases: ["hitmonchans", "hh"],
	category: 'identification',
	class: HitmonchansHangman,
	defaultOptions: ['points'],
	description: "Players guess letters to fill in the blanks and reveal the answers!",
	formerNames: ["Hangman"],
	freejoin: true,
	name: "Hitmonchan's Hangman",
	mascot: "Hitmonchan",
	minigameCommand: 'hangman',
	minigameDescription: 'Use ``' + Config.commandCharacter + 'g`` to guess one letter per round or the answer!',
	modes: ['survival', 'group'],
	modeProperties: {
		'survival': {
			guessLimit: 4,
			incorrectGuessTime: 1000,
		},
	},
	variants: [
		{
			name: "Hitmonchan's Ability Hangman",
			variant: "Pokemon Abilities",
			variantAliases: ['ability', 'abilities'],
		},
		{
			name: "Hitmonchan's Character Hangman",
			variant: "Characters",
			variantAliases: ['character'],
		},
		{
			name: "Hitmonchan's Item Hangman",
			variant: "Pokemon Items",
			variantAliases: ['item', 'items'],
		},
		{
			name: "Hitmonchan's Location Hangman",
			variant: "Locations",
			variantAliases: ['location'],
		},
		{
			name: "Hitmonchan's Move Hangman",
			variant: "Pokemon Moves",
			variantAliases: ['move', 'moves'],
		},
		{
			name: "Hitmonchan's Pokemon Hangman",
			variant: "Pokemon",
		},
	],
});
