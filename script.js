const players = [];

const playerNameInput = document.getElementById("playerName");
const addPlayerButton = document.getElementById("addPlayerButton");
const playerTableBody = document.getElementById("playerTableBody");
const teamResults = document.getElementById("teamResults");
const sittingOutTableBody = document.getElementById("sittingOutTableBody");

// position-based list
const setterTableBody = document.getElementById("setterTableBody");
const outsideTableBody = document.getElementById("outsideTableBody");
const rightsideTableBody = document.getElementById("rightsideTableBody");
const middleTableBody = document.getElementById("middleTableBody");

// position-based add
const setterNameInput = document.getElementById("setterNameInput");
const outsideNameInput = document.getElementById("outsideNameInput");
const rightsideNameInput = document.getElementById("rightsideNameInput");
const middleNameInput = document.getElementById("middleNameInput");

const addSetterButton = document.getElementById("addSetterButton");
const addOutsideButton = document.getElementById("addOutsideButton");
const addRightsideButton = document.getElementById("addRightsideButton");
const addMiddleButton = document.getElementById("addMiddleButton");

// shuffle status
const shuffleButton = document.getElementById("shuffleButton");

// bias
const MAX_BIAS_DIFFERENCE = 1;

// clear buttons
const clearPositionButton = document.getElementById("clearPositionButton");
const clearBiasButton = document.getElementById("clearBiasButton");
const clearPriorityButton = document.getElementById("clearPriorityButton");


addPlayerButton.addEventListener("click", addPlayer);

clearPositionButton.addEventListener("click", clearPosition);
clearBiasButton.addEventListener("click", clearBias);
clearPriorityButton.addEventListener("click", clearPriority);

playerNameInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        addPlayer();
    }
});

shuffleButton.addEventListener("click", shuffleTeams);

addSetterButton.addEventListener("click", function () {
    addPlayerToPosition(setterNameInput, "setter");
});

addOutsideButton.addEventListener("click", function () {
    addPlayerToPosition(outsideNameInput, "outside");
});

addRightsideButton.addEventListener("click", function () {
    addPlayerToPosition(rightsideNameInput, "rightside");
});

addMiddleButton.addEventListener("click", function () {
    addPlayerToPosition(middleNameInput, "middle");
});

loadPlayers();
renderPlayers();
updatePositionGroups();
loadSavedMatchups();
loadSavedSittingOut();

function addPlayer() {
    const playerName = formatName(playerNameInput.value.trim());
    const quickPosition = "na";

    if (playerName == "") { // rejects blank name
        alert("Please enter a player name.");
        return;
    }

    const existingPlayer = players.find(function (player) {
        return player.name.toLowerCase() === playerName.toLowerCase();
    });

    if (existingPlayer) {
        existingPlayer.position = quickPosition;
    } else {
        const player = { // player object
            name: playerName,
            position: quickPosition,
            bias: "none",
            priority: 0
        };
        players.push(player);
    }

    renderPlayers();
    updatePositionGroups();
    savePlayers();

    playerNameInput.value = "";
    playerNameInput.focus();
}

function addPlayerToPosition(inputElement, position) {
    const playerName = formatName(inputElement.value.trim());

    if (playerName === "") {
        alert("Please enter a player name.");
        return;
    }

    const existingPlayer = players.find(function (player) {
        return player.name.toLowerCase() === playerName.toLowerCase();
    });

    if (existingPlayer) {
        existingPlayer.position = position;
    } else {
        const player = {
            name: playerName,
            position: position,
            bias: "none",
            priority: 0
        };

        players.push(player);
    }

    renderPlayers();
    updatePositionGroups();
    savePlayers();

    inputElement.value = "";
    inputElement.focus();
}

function formatName(name) {
    const words = name.toLowerCase().split(" ");
    const formattedWords = [];

    for (let i = 0; i < words.length; i++) {
        if (words[i] === "") {
            continue;
        }

        const firstLetter = words[i][0].toUpperCase();
        const restOfWord = words[i].slice(1);

        formattedWords.push(firstLetter + restOfWord)
    }

    return formattedWords.join(" ");
}

function renderPlayers() { 
    // everytime a player is added, removed, or dropdown selection has been changed, rebuild a new table with proper elements
    // this process is O(n) time complexity, but we are assuming the sample size (players) are around 30-40 at most.
    playerTableBody.innerHTML = ""; // wipe the table (only visually)

    players.sort(function (playerA, playerB) { // sort the table in alphabetical order
        return playerA.name.localeCompare(playerB.name);
    });

    for (let i = 0; i < players.length; i++ ){
        const player = players[i]; // for each player

        const row = document.createElement("tr"); // create new row

        row.innerHTML = `
            <td>${player.name}</td>

            <td>
                <select class="positionSelect">
                    <option value="na">N/A</option>
                    <option value="setter">Setter</option>
                    <option value="outside">Outside</option>
                    <option value="rightside">Rightside</option>
                    <option value="middle">Middle</option>
                </select>
            </td>

            <td>
                <select class="biasSelect">
                    <option value="none">0</option>
                    <option value="restriction">+</option>
                    <option value="better">-</option>
                </select>
            </td>

            <td>
                <input
                    class="priorityInput"
                    type="number"
                    min="0"
                    value="${player.priority}"
                    inputmode="numeric"
                >
            </td>

            <td>
                <button type="button" class="deleteButton">
                    -
                </button>
            </td>
        `;

        const positionSelect = row.querySelector(".positionSelect");
        const biasSelect = row.querySelector(".biasSelect");
        const priorityInput = row.querySelector(".priorityInput");
        const removeButton = row.querySelector(".removeButton");
        const deleteButton = row.querySelector(".deleteButton");

        positionSelect.value = player.position;
        biasSelect.value = player.bias;
        
        positionSelect.addEventListener("change", function () {
            player.position = positionSelect.value;
            updatePositionGroups();
            savePlayers();
        });

        biasSelect.addEventListener("change", function () {
            player.bias = biasSelect.value;
            savePlayers();
        });

        priorityInput.addEventListener("change", function () {
            player.priority = Number(priorityInput.value); // rejects non-numbers

            if (player.priority < 0) { // rejects negative numbers
                player.priority = 0;
                priorityInput.value = 0;
            }

            updatePositionGroups();
            savePlayers();
        });

        deleteButton.addEventListener("click", function () {
            removePlayer(player); // delete player
            updatePositionGroups();
            savePlayers();
        })

        playerTableBody.appendChild(row);        
    }
}

function removePlayer(playerToRemove) {
    const playerIndex = players.indexOf(playerToRemove);

    if (playerIndex !== -1) {
        players.splice(playerIndex, 1);
    }
    renderPlayers();
    updatePositionGroups();
}

function updatePositionGroups() {
    setterTableBody.innerHTML = "";
    outsideTableBody.innerHTML = "";
    rightsideTableBody.innerHTML = "";
    middleTableBody.innerHTML = "";

    for (let i = 0; i < players.length; i++) {
        const player = players[i];

        if (player.position === "na") {
            continue;
        }

        const row = createPositionGroupRow(player);

        if (player.position === "setter") {
            setterTableBody.appendChild(row);
        } else if (player.position === "outside") {
            outsideTableBody.appendChild(row);
        } else if (player.position === "rightside") {
            rightsideTableBody.appendChild(row);
        } else if (player.position === "middle") {
            middleTableBody.appendChild(row);
        }
    }
}

function createPositionGroupRow(player) {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${player.name}</td>
        <td>
            <input
                class="groupPriorityInput"
                type="number"
                min="0"
                value="${player.priority}"
            >
        </td>

        <td>
            <button type="button" class="removeButton">
                -
            </button>
        </td>
    `;

    const groupPriorityInput = row.querySelector(".groupPriorityInput");
    const removeButton = row.querySelector(".removeButton");

    groupPriorityInput.addEventListener("change", function () {
        player.priority = Number(groupPriorityInput.value);

        if (player.priority < 0) {
            player.priority = 0;
            groupPriorityInput.value = 0;
        }

        renderPlayers();
        updatePositionGroups();
        savePlayers();
    });

    removeButton.addEventListener("click", function () {
        player.position = "na";
        renderPlayers();
        updatePositionGroups();
        savePlayers();
    });

    return row;
}

function canShuffleTeams() {
    let setterCount = 0;
    let outsideCount = 0;
    let rightsideCount = 0;
    let middleCount = 0;

    for (let i = 0; i < players.length; i++) {
        if (players[i].position === "setter") {
            setterCount++;
        } else if (players[i].position === "outside") {
            outsideCount++;
        } else if (players[i].position === "rightside") {
            rightsideCount++;
        } else if (players[i].position === "middle") {
            middleCount++;
        }
    }
    const presentPlayerCount = 
        setterCount + outsideCount + rightsideCount + middleCount;

    if (presentPlayerCount < 8) {
        alert("Not enough players. You need at least 8 present players to create two teams.")
        return false;
    }

    const counts = [setterCount, outsideCount, rightsideCount, middleCount];

    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);

    if (maxCount - minCount > 1) {
        alert("Position counts are too uneven. Each position count should differ by no more than 1.")
        return false;
    }
    // Passed all test, CAN shuffle.
    return true;
}

function createTeamOnce() {
    const setters = [];
    const outsides = [];
    const rightsides = [];
    const middles = [];

    for (let i = 0; i < players.length; i++) {
        if (players[i].position === "setter") {
            setters.push(players[i]);
        } else if (players[i].position === "outside") {
            outsides.push(players[i]);
        } else if (players[i].position === "rightside") {
            rightsides.push(players[i]);
        } else if (players[i].position === "middle") {
            middles.push(players[i]);
        }
    }

    const numberOfTeams = Math.min(
        setters.length,
        outsides.length,
        rightsides.length,
        middles.length
    );

    const selectedSetters = selectPlayersByPriority(setters, numberOfTeams);
    const selectedOutsides = selectPlayersByPriority(outsides, numberOfTeams);
    const selectedRightsides = selectPlayersByPriority(rightsides, numberOfTeams);
    const selectedMiddles = selectPlayersByPriority(middles, numberOfTeams);

    const teams = [];

    for (let i = 0; i < numberOfTeams; i++) {
        const team = [
            selectedSetters[i],
            selectedOutsides[i],
            selectedRightsides[i],
            selectedMiddles[i]
        ];

        teams.push(team);
    }
    return teams;
}

function shuffleTeams() {
    if (!canShuffleTeams()) {
        return;
    }

    const confirmed = confirm("Are you sure you'd like to shuffle teams?");

    if (!confirmed) {
        return;
    }

    const courtGroups = createCourtGroupsByPriority();
    
    if (courtGroups.length === 0) {
        alert("Not enough players to create teams.");
        return;
    }

    const finalMatchups = [];
    const finalTeams = [];

    for (let i = 0; i < courtGroups.length; i++) {
        const matchupResult = createBestMatchupForCourt(courtGroups[i]);

        finalMatchups.push(matchupResult.matchup);

        finalTeams.push(matchupResult.matchup[0]);
        finalTeams.push(matchupResult.matchup[1]);
    }

    updatePrioritiesAfterShuffle(finalTeams);
    displayMatchups(finalMatchups);
    saveMatchups(finalMatchups);
}

function createCourtGroupsByPriority() {
    const setters = [];
    const outsides = [];
    const rightsides = [];
    const middles = [];

    for (let i = 0; i < players.length; i++) {
        if (players[i].position === "setter") {
            setters.push(players[i]);
        } else if (players[i].position === "outside") {
            outsides.push(players[i]);
        } else if (players[i].position === "rightside") {
            rightsides.push(players[i]);
        } else if (players[i].position === "middle") {
            middles.push(players[i]);
        }
    }

    const possibleTeams = Math.min(
        setters.length,
        outsides.length,
        rightsides.length,
        middles.length
    );

    const numberOfCourts = Math.floor(possibleTeams / 2);

    const numberOfTeamsNeeded = numberOfCourts * 2;

    const selectedSetters = selectedPlayersForPriority(setters, numberOfTeamsNeeded);
    const selectedOutsides = selectedPlayersForPriority(outsides, numberOfTeamsNeeded);
    const selectedRightsides = selectedPlayersForPriority(rightsides, numberOfTeamsNeeded);
    const selectedMiddles = selectedPlayersForPriority(middles, numberOfTeamsNeeded);

    const courtGroups = [];

    for (let courtIndex = 0; courtIndex < numberOfCourts; courtIndex++) {
        const startIndex = courtIndex * 2;

        const courtPlayers = [
            selectedSetters[startIndex],
            selectedSetters[startIndex + 1],

            selectedOutsides[startIndex],
            selectedOutsides[startIndex + 1],

            selectedRightsides[startIndex],
            selectedRightsides[startIndex + 1],

            selectedMiddles[startIndex],
            selectedMiddles[startIndex + 1],
        ];

        courtGroups.push(courtPlayers);
    }

    return courtGroups;
}

function selectedPlayersForPriority(positionArray, numberNeeded) {
    const copiedArray = [];

    for (let i = 0; i < positionArray.length; i++) {
        copiedArray.push({
            player: positionArray[i],
            randomTieBreaker: Math.random()
        });
    }

    copiedArray.sort(function (itemA, itemB) {
        const priorityA = Number(itemA.player.priority);
        const priorityB = Number(itemB.player.priority);

        if (priorityB !== priorityA) {
            return priorityB - priorityA;
        }

        return itemA.randomTieBreaker - itemB.randomTieBreaker;
    });

    const selectedPlayers = [];

    for (let i = 0; i < numberNeeded && i < copiedArray.length; i++) {
        selectedPlayers.push(copiedArray[i].player);
    }

    return selectedPlayers;
}

function createBestMatchupForCourt(courtPlayers) {
    const setters = [];
    const outsides = [];
    const rightsides = [];
    const middles = [];

    for (let i = 0; i < courtPlayers.length; i++) {
        const player = courtPlayers[i];

        if (player.position === "setter") {
            setters.push(player);
        } else if (player.position === "outside") {
            outsides.push(player);
        } else if (player.position === "rightside") {
            rightsides.push(player);
        } else if (player.position === "middle") {
            middles.push(player);
        }
    }

    const allPossibleMatchups = [];

    for (let setterChoice = 0; setterChoice < 2; setterChoice++) {
        for (let outsideChoice = 0; outsideChoice < 2; outsideChoice++) {
            for (let rightsideChoice = 0; rightsideChoice < 2; rightsideChoice++) {
                for (let middleChoice = 0; middleChoice < 2; middleChoice++) {
                    const teamA = [
                        setters[setterChoice],
                        outsides[outsideChoice],
                        rightsides[rightsideChoice],
                        middles[middleChoice]
                    ];

                    const teamB = [
                        setters[1 - setterChoice],
                        outsides[1 - outsideChoice],
                        rightsides[1 - rightsideChoice],
                        middles[1 - middleChoice]
                    ];

                    const teamAScore = getTeamBiasScore(teamA);
                    const teamBScore = getTeamBiasScore(teamB);
                    const biasGap = Math.abs(teamAScore - teamBScore);

                    allPossibleMatchups.push({
                        matchup: [teamA, teamB],
                        biasGap: biasGap
                    });
                }
            }
        }
    }

    shuffleArray(allPossibleMatchups);

    allPossibleMatchups.sort(function (matchupA, matchupB) {
        return matchupA.biasGap - matchupB.biasGap;
    });

    return allPossibleMatchups[0];
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));

        const temp = array[i];
        array[i] = array[randomIndex];
        array[randomIndex] = temp;
    }
}

function selectPlayersByPriority(positionArray, numberOfTeams) {
    shuffleArray(positionArray);

    positionArray.sort(function (playerA, playerB) {
        return playerB.priority - playerA.priority;
    });

    const selectedPlayers = positionArray.slice(0, numberOfTeams);

    shuffleArray(selectedPlayers);

    return selectedPlayers;
}

function displayMatchups(matchups) {
    teamResults.innerHTML = "";

    let teamNumber = 1;

    for (let i = 0; i < matchups.length; i++) {
        const matchupDiv = document.createElement("div");

        const teamA = matchups[i][0];
        const teamB = matchups[i][1];

        matchupDiv.innerHTML = `
            <h3>Court ${i + 1}</h3>

            <h4>Team ${teamNumber}</h4>
            <table>
                <tbody>
                    <tr><td>${teamA[0].name}</td></tr>
                    <tr><td>${teamA[1].name}</td></tr>
                    <tr><td>${teamA[2].name}</td></tr>
                    <tr><td>${teamA[3].name}</td></tr>
                </tbody>
            </table>

            <h4>vs</h4>

            <h4>Team ${teamNumber + 1}</h4>
            <table>
                <tbody>
                    <tr><td>${teamB[0].name}</td></tr>
                    <tr><td>${teamB[1].name}</td></tr>
                    <tr><td>${teamB[2].name}</td></tr>
                    <tr><td>${teamB[3].name}</td></tr>
                </tbody>
            </table>
        `;

        teamResults.appendChild(matchupDiv);

        teamNumber += 2;
    }
}

function displaySavedMatchups(matchups) { // restore the matchups when the user refreshes the page
    teamResults.innerHTML = "";

    let teamNumber = 1;

    for (let i = 0; i < matchups.length; i++) {
        const matchupDiv = document.createElement("div");

        const teamA = matchups[i][0];
        const teamB = matchups[i][1];

        matchupDiv.innerHTML = `
            <h3>Court ${i + 1}</h3>

            <h4>Team ${teamNumber}</h4>
            <table>
                <tbody>
                    <tr><td>${teamA[0]}</td></tr>
                    <tr><td>${teamA[1]}</td></tr>
                    <tr><td>${teamA[2]}</td></tr>
                    <tr><td>${teamA[3]}</td></tr>
                </tbody>
            </table>

            <h4>vs</h4>

            <h4>Team ${teamNumber + 1}</h4>
            <table>
                <tbody>
                    <tr><td>${teamB[0]}</td></tr>
                    <tr><td>${teamB[1]}</td></tr>
                    <tr><td>${teamB[2]}</td></tr>
                    <tr><td>${teamB[3]}</td></tr>
                </tbody>
            </table>
        `;

        teamResults.appendChild(matchupDiv);

        teamNumber += 2;
    }
}

function updatePrioritiesAfterShuffle(teams) {
    const selectedPlayers = [];
    const sittingOutPlayers = [];

    for (let i = 0; i < teams.length; i++) {
        for (let j = 0; j < teams[i].length; j++) {
            selectedPlayers.push(teams[i][j]);
        }
    }

    for (let i = 0; i < players.length; i++) {
        const player = players[i];

        if (player.position === "na") {
            continue;
        }

        if (!selectedPlayers.includes(player)) {
            player.priority++;
            sittingOutPlayers.push(player);
        }
    }
    
    const firstSittingTeamNumber = teams.length + 1;

    const sittingOutData = displaySittingOutPlayers(
        sittingOutPlayers,
        firstSittingTeamNumber
    );

    renderPlayers();
    updatePositionGroups();
    savePlayers();
    saveSittingOut(sittingOutData);
}

function displaySittingOutPlayers(sittingOutPlayers, firstTeamNumber) {
    sittingOutTableBody.innerHTML = "";

    if (sittingOutPlayers.length === 0) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>No players sitting out.</td>
        `;

        sittingOutTableBody.appendChild(row);

        return {
            model: "list",
            names: []
        };
    }

    if (sittingOutPlayers.length < 4) {
        const names = [];

        for (let i = 0; i < sittingOutPlayers.length; i++) {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${sittingOutPlayers[i].name}</td>
            `;

            sittingOutTableBody.appendChild(row);
            names.push(sittingOutPlayers[i].name);
        }

        return {
            model: "list",
            names: names
        };
    }

    const sittingTeams = createSittingOutTeams(
        sittingOutPlayers,
        firstTeamNumber
    );

    const savedTeams = [];

    for (let i = 0; i < sittingTeams.length; i++) {
        const team = sittingTeams[i];

        const headerRow = document.createElement("tr");

        headerRow.classList.add("sittingTeamHeader");

        headerRow.innerHTML = `
            <td>${team.label}</td>
        `;

        sittingOutTableBody.appendChild(headerRow);

        const savedNames = [];

        for (let j = 0; j < team.players.length; j++) {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${team.players[j].name}</td>
            `;

            sittingOutTableBody.appendChild(row);
            savedNames.push(team.players[j].name);
        }

        savedTeams.push({
            label: team.label,
            names: savedNames
        });
    }

    return {
        mode: "teams",
        teams: savedTeams
    };
}

function createSittingOutTeams(sittingOutPlayers, firstTeamNumber) {
    const remainingPlayers = sittingOutPlayers.slice();

    remainingPlayers.sort(function (playerA, playerB) {
        return playerB.priority - playerA.priority;
    });

    const sittingTeams = [];
    const positions = ["setter", "outside", "rightside", "middle"];

    while (remainingPlayers.length > 0) {
        const team = [];

        for (let i = 0; i < positions.length; i++) {
            const position = positions[i];

            const playerIndex = remainingPlayers.findIndex(function (player) {
                return player.position === position;
            });

            if (playerIndex !== -1 && team.length < 4) {
                const player = remainingPlayers.splice(playerIndex, 1)[0];
                team.push(player);
            }
        }

        while (team.length < 4 && remainingPlayers.length > 0) {
            team.push(remainingPlayers.shift());
        }

        const teamNumber = firstTeamNumber + sittingTeams.length;

        let label = `Team ${teamNumber}`;

        if (team.length < 4) {
            label = `Team ${teamNumber} / Pickup`;
        }

        sittingTeams.push({
            label: label,
            players: team
        });
    }

    return sittingTeams;
}

function savePlayers() {
    localStorage.setItem("players", JSON.stringify(players));
}

function loadPlayers() {
    const savedPlayers = localStorage.getItem("players");

    if (savedPlayers !== null) {
        const parsedPlayers = JSON.parse(savedPlayers);

        for (let i = 0; i < parsedPlayers.length; i++) {
            players.push(parsedPlayers[i]);
        }
    }
}

function saveMatchups(matchups){
    const matchupsToSave = [];

    for (let i = 0; i < matchups.length; i++) {
        const teamA = matchups[i][0];
        const teamB = matchups[i][1];

        const savedTeamA = [];
        const savedTeamB = [];

        for (let j = 0; j < teamA.length; j++) {
            savedTeamA.push(teamA[j].name);
        }

        for (let j = 0; j < teamB.length; j++) {
            savedTeamB.push(teamB[j].name);
        }

        matchupsToSave.push([savedTeamA, savedTeamB]);
    }

    localStorage.setItem("savedMatchups", JSON.stringify(matchupsToSave));
}

function loadSavedMatchups() {
    const savedMatchups = localStorage.getItem("savedMatchups");

    if (savedMatchups === null) {
        return;
    }

    const parseMatchups = JSON.parse(savedMatchups);

    displaySavedMatchups(parseMatchups);
}

function saveSittingOut(sittingOutData) {
    if (sittingOutData === undefined) {
        sittingOutData = {
            mode: "list",
            names: []
        };
    }

    localStorage.setItem("savedSittingOut", JSON.stringify(sittingOutData));
}

function loadSavedSittingOut() {
    const savedSittingOut = localStorage.getItem("savedSittingOut");

    if (savedSittingOut === null) {
        return;
    }

    const parsedSittingOut = JSON.parse(savedSittingOut);

    sittingOutTableBody.innerHTML = "";

    for (let i = 0; i < parsedSittingOut.length; i++) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${parsedSittingOut[i].name}</td>
        `;

        sittingOutTableBody.appendChild(row);
    }
}

function getBiasValue(player) {
    if (player.bias === "restriction") {
        return 1;
    } else if (player.bias === "better") {
        return -1;
    }

    return 0;
}

function getTeamBiasScore(team) {
    let score = 0;

    for (let i = 0; i < team.length; i++) {
        score += getBiasValue(team[i]);
    }
    return score;
}

function BiasCheck(teams) {
    for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 >= teams.length) {
            break;
        }

        const teamAScore = getTeamBiasScore(teams[i]);
        const teamBScore = getTeamBiasScore(teams[i+1]);

        const difference  = Math.abs(teamAScore - teamBScore);

        if (difference > MAX_BIAS_DIFFERENCE) {
            return false;
        }

        return true;
    }
}

function createValidMatchups(teams) {
    const unpairedTeams = teams.slice();
    const matchups = [];

    shuffleArray(unpairedTeams);

    while (unpairedTeams.length >= 2) {
        const teamA = unpairedTeams.shift();
        const teamAScore = getTeamBiasScore(teamA);

        let bestIndex = -1;

        for (let i = 0; i < unpairedTeams.length; i++) {
            const teamB = unpairedTeams[i];
            const teamBScore = getTeamBiasScore(teamB);

            const difference = Math.abs(teamAScore - teamBScore);

            if (difference <= MAX_BIAS_DIFFERENCE) {
                bestIndex = i;
                break;
            }
        }

        if (bestIndex === -1) {
            return null; // couldn't find a valid match, reshuffle
        }

        const teamB = unpairedTeams.splice(bestIndex, 1)[0];

        matchups.push([teamA, teamB]);
    }

    return matchups;
}

function clearPosition() {
    const confirmed = confirm("Clear all player positions?");

    if (!confirmed) {
        return;
    }

    for (let i = 0; i < players.length; i++) {
        players[i].position = "na";
    }

    renderPlayers();
    updatePositionGroups();
    savePlayers();
}

function clearBias() {
    const confirmed = confirm("Clear all bias settings?");

    if (!confirmed) {
        return;
    }

    for (let i = 0; i < players.length; i++) {
        players[i].bias = "none";
    }

    renderPlayers();
    savePlayers();
}

function clearPriority() {
    const confirmed = confirm("Clear all priority numbers?");

    if (!confirmed) {
        return;
    }

    for (let i = 0; i < players.length; i++) {
        players[i].priority = 0;
    }

    renderPlayers();
    updatePositionGroups();
    savePlayers();
    saveSittingOut();
}