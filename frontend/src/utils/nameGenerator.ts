const ADJECTIVES = [
    "Anonymous", "Brave", "Clever", "Daring", "Eager", "Fancy", "Gentle",
    "Happy", "Jolly", "Kind", "Lively", "Merry", "Nice", "Polite", "Quiet",
    "Rapid", "Silly", "Tidy", "Witty", "Zesty"
];

const ANIMALS = [
    "Panda", "Fox", "Eagle", "Badger", "Bear", "Cat", "Dog", "Dolphin",
    "Falcon", "Giraffe", "Hawk", "Iguana", "Koala", "Lion", "Monkey",
    "Owl", "Penguin", "Rabbit", "Tiger", "Wolf"
];

export function generateRandomName(): string {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    return `${adj} ${animal}`;
}

export function getRandomColor(): string {
    const colors = ['#EC5E41', '#F29F05', '#F2CB05', '#04BF9D', '#038C7F', '#5D3FD3', '#FF69B4'];
    return colors[Math.floor(Math.random() * colors.length)];
}