const synth = window.speechSynthesis;
const voices = synth.getVoices();
let volume = 0;

function say(text, pitch = 1, rate = 1) {
	if (volume === 0) return;
	if (synth.speaking) {
		synth.pause();
		synth.cancel();
	}
	let spokenText = text;
	if (Array.isArray(spokenText)) {
		spokenText = spokenText.join(".");
	}
	let speech = new SpeechSynthesisUtterance(spokenText);
	speech.voice = voices[0];
	speech.pitch = pitch;
	speech.rate = rate;
	speech.volume = volume;
	speech.lang = "en-US";
	synth.speak(speech);
}

function stopSpeaking() {
	if (synth) {
		synth.pause();
		synth.cancel();
	}
}

function setVolume(value) {
	volume = value;
}
export { stopSpeaking, setVolume };
export default say;
