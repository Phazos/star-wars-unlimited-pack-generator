// app.js

function resetForm() {
    // Reset all input fields to default values
    document.querySelectorAll('input[type="number"]').forEach(input => input.value = 0);
    document.getElementById('packs').value = 1;
    document.getElementById('result').innerText = '';
}

function generatePacks() {
    // Get the number of packs to generate
    const numPacks = parseInt(document.getElementById('packs').value);

    // Initialize card piles
    const leaders = { total: parseInt(document.getElementById('leaders').value) };
    const bases = { total: parseInt(document.getElementById('bases').value) };

    const aspects = ['red', 'blue', 'green', 'yellow', 'colorless'];

    const commons = {};
    const uncommons = {};
    const rares = {};

    aspects.forEach(aspect => {
        commons[aspect] = parseInt(document.getElementById(`common-${aspect}`).value);
        uncommons[aspect] = parseInt(document.getElementById(`uncommon-${aspect}`).value);
        rares[aspect] = parseInt(document.getElementById(`rare-${aspect}`).value);
    });

    // Calculate max packs
    const maxPacksLeaders = Math.floor(leaders.total / 1);
    const maxPacksBases = Math.floor(bases.total / 1);

    const totalCommons = Object.values(commons).reduce((a, b) => a + b, 0);
    const maxPacksCommons = Math.floor(totalCommons / 9);

    const totalUncommons = Object.values(uncommons).reduce((a, b) => a + b, 0);
    const maxPacksUncommons = Math.floor(totalUncommons / 3);

    const totalRares = Object.values(rares).reduce((a, b) => a + b, 0);
    const maxPacksRares = Math.floor(totalRares / 1);

    // For the 'any rarity' card, we need to find the limiting rarity
    const totalCards = totalCommons + totalUncommons + totalRares;
    const maxPacksAnyRarity = Math.floor(totalCards / 14);

    const maxPacksPossible = Math.min(
        maxPacksLeaders,
        maxPacksBases,
        maxPacksCommons,
        maxPacksUncommons,
        maxPacksRares,
        maxPacksAnyRarity
    );

    if (numPacks > maxPacksPossible) {
        alert(`Cannot generate ${numPacks} packs. Maximum possible packs: ${maxPacksPossible}`);
        return;
    }

    // Deep copy the piles to avoid modifying the original counts
    const commonsCopy = { ...commons };
    const uncommonsCopy = { ...uncommons };
    const raresCopy = { ...rares };
    const leadersCopy = { total: leaders.total };
    const basesCopy = { total: bases.total };

    let resultText = '';

    for (let packNum = 1; packNum <= numPacks; packNum++) {
        let remainingPacks = numPacks - packNum;
        resultText += `Pack ${packNum}:\n`;

        // Generate Leader
        let leaderCard = getRandomCard(leadersCopy, 'Leader');
        resultText += `Leader: ${leaderCard}\n`;

        // Generate Base
        let baseCard = getRandomCard(basesCopy, 'Base');
        resultText += `Base: ${baseCard}\n`;

        // Generate Commons
        for (let i = 0; i < 9; i++) {
            let commonCard = getRandomCardFromAspects(commonsCopy, 'Common');
            resultText += `Common ${i + 1}: ${commonCard}\n`;
        }

        // Generate Uncommons
        for (let i = 0; i < 3; i++) {
            let uncommonCard = getRandomCardFromAspects(uncommonsCopy, 'Uncommon');
            resultText += `Uncommon ${i + 1}: ${uncommonCard}\n`;
        }

        // Generate Rare/Legendary
        let rareCard = getRandomCardFromAspects(raresCopy, 'Rare/Legendary');
        resultText += `Rare/Legendary: ${rareCard}\n`;

        // Generate Any Rarity
        let anyCard = getRandomCardAnyRarity(commonsCopy, uncommonsCopy, raresCopy, remainingPacks);
        resultText += `Any Rarity: ${anyCard}\n`;

        resultText += '\n';
    }

    document.getElementById('result').innerText = resultText;
}

function getRandomCard(pile, type) {
    if (pile.total <= 0) {
        alert(`No more ${type}s available.`);
        throw new Error(`No more ${type}s available.`);
    }
    const randomNum = Math.floor(Math.random() * pile.total) + 1;
    pile.total -= 1;
    return randomNum;
}

function getRandomCardFromAspects(piles, rarity) {
    const totalCards = Object.values(piles).reduce((a, b) => a + b, 0);
    if (totalCards <= 0) {
        alert(`No more ${rarity} cards available.`);
        throw new Error(`No more ${rarity} cards available.`);
    }
    let randomNum = Math.floor(Math.random() * totalCards) + 1;
    for (let aspect in piles) {
        if (piles[aspect] >= randomNum) {
            const cardNum = randomNum;
            piles[aspect] -= 1;
            return `${capitalizeFirstLetter(aspect)} ${cardNum}`;
        } else {
            randomNum -= piles[aspect];
        }
    }
}

function getRandomCardAnyRarity(commons, uncommons, rares, remainingPacks) {
    const aspects = ['red', 'blue', 'green', 'yellow', 'colorless'];

    // Collect surplus cards
    const surplusCards = [];

    // Collect surplus commons
    let minRequiredCommons = 9 * remainingPacks;
    let totalCommons = Object.values(commons).reduce((a, b) => a + b, 0);
    let surplusCommonCount = totalCommons - minRequiredCommons;

    aspects.forEach(aspect => {
        let surplus = commons[aspect] - (Math.max(0, commons[aspect] - surplusCommonCount));
        if (surplus > 0) {
            surplusCards.push({
                rarity: 'Common',
                aspect: aspect,
                count: surplus,
                pile: commons
            });
        }
    });

    // Collect surplus uncommons
    let minRequiredUncommons = 3 * remainingPacks;
    let totalUncommons = Object.values(uncommons).reduce((a, b) => a + b, 0);
    let surplusUncommonCount = totalUncommons - minRequiredUncommons;

    aspects.forEach(aspect => {
        let surplus = uncommons[aspect] - (Math.max(0, uncommons[aspect] - surplusUncommonCount));
        if (surplus > 0) {
            surplusCards.push({
                rarity: 'Uncommon',
                aspect: aspect,
                count: surplus,
                pile: uncommons
            });
        }
    });

    // Collect surplus rares
    let minRequiredRares = 1 * remainingPacks;
    let totalRares = Object.values(rares).reduce((a, b) => a + b, 0);
    let surplusRareCount = totalRares - minRequiredRares;

    aspects.forEach(aspect => {
        let surplus = rares[aspect] - (Math.max(0, rares[aspect] - surplusRareCount));
        if (surplus > 0) {
            surplusCards.push({
                rarity: 'Rare/Legendary',
                aspect: aspect,
                count: surplus,
                pile: rares
            });
        }
    });

    // Total surplus cards
    const totalSurplusCards = surplusCards.reduce((sum, item) => sum + item.count, 0);

    if (totalSurplusCards <= 0) {
        alert('Not enough surplus cards to generate the Any Rarity slot without affecting required slots.');
        throw new Error('Not enough surplus cards to generate Any Rarity slot.');
    }

    // Randomly select a surplus card
    let randomNum = Math.floor(Math.random() * totalSurplusCards) + 1;

    for (const item of surplusCards) {
        if (randomNum <= item.count) {
            // Remove the card from the pile
            item.pile[item.aspect] -= 1;

            // Return the card information
            return `${item.rarity} ${capitalizeFirstLetter(item.aspect)} ${item.pile[item.aspect] + 1}`;
        } else {
            randomNum -= item.count;
        }
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
