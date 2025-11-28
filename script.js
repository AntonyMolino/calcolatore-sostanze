let risultati = [];

const sostanzeMappa = {
    cocaina: ["cocaina", "coca"],
    ketamina: ["ketamina", "keta"],
    eroina: ["eroina"],
    lsd: ["lsd", "acido", "francobolli"],
    marijuana: ["maria", "marijuana", "erba"],
    fenicillina: ["fenicillina"],
    metanfetamina: ["metanfetamina", "meta", "meth"],
};

// Prezzi modificabili
let prezziDroga = {
    cocaina: 500,
    ketamina: 380,
    eroina: 450,
    lsd: 420,
    marijuana: 480,
    fenicillina: 380,
    metanfetamina: 600,
};

function salvaDati() {
    localStorage.setItem("famiglieDroghe", JSON.stringify(risultati));
}

function caricaDati() {
    const datiSalvati = localStorage.getItem("famiglieDroghe");
    if (datiSalvati) {
        risultati = JSON.parse(datiSalvati);
        mostraRisultati();
    }
}

function eliminaDati() {
    if (!confirm("Sei sicuro di eliminare tutti i dati?")) return;
    localStorage.removeItem("famiglieDroghe");
    risultati = [];
    pulisciCampi();
    mostraRisultati();
}

function pulisciCampi() {
    document.getElementById("famiglia").value = "";
    document.getElementById("sostanze").value = "";
    document.getElementById("sanzione").value = "";
    document.getElementById("inputArea").value = "";
    document.getElementById("gratuita").value = "";
}

function normalizzaTipo(tipo) {
    for (const [tipoCanonico, alias] of Object.entries(sostanzeMappa)) {
        if (alias.includes(tipo.toLowerCase())) {
            return tipoCanonico;
        }
    }
    return tipo;
}
// Somiglianza tra parole (Levenshtein semplificato)
function similarity(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    let matches = 0;
    const len = Math.min(a.length, b.length);

    for (let i = 0; i < len; i++) {
        if (a[i] === b[i]) matches++;
    }
    return matches / Math.max(a.length, b.length);
}

// Restituisce il miglior suggerimento per un tipo sconosciuto
function suggerisciDroga(tipoInserito) {
    tipoInserito = tipoInserito.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const [canonico, alias] of Object.entries(sostanzeMappa)) {
        for (const a of alias) {
            const score = similarity(tipoInserito, a);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = canonico;
            }
        }
    }

    if (bestScore >= 0.45) {
        return bestMatch;
    }

    return null; // nessun suggerimento utile
}


function formattaNumero(num) {
    return num.toLocaleString("it-IT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

// Gestione prezzi in localStorage
function caricaPrezzi() {
    const salvati = localStorage.getItem("prezziDroga");
    if (salvati) {
        try {
            const parsed = JSON.parse(salvati);
            prezziDroga = { ...prezziDroga, ...parsed };
        } catch (e) {
            console.warn("Prezzi salvati corrotti, uso default.");
        }
    }
}

function salvaPrezzi() {
    localStorage.setItem("prezziDroga", JSON.stringify(prezziDroga));
}

function popolaFormPrezzi() {
    for (const tipo in prezziDroga) {
        const input = document.getElementById("price-" + tipo);
        if (input) {
            input.value = prezziDroga[tipo];
        }
    }
}

async function salvaPrezziDaUI() {
  const pwd = prompt("Inserisci la password per salvare i prezzi:");
  if (!pwd) {
    alert("Operazione annullata.");
    return;
  }

  // HASH DELLA PASSWORD CORRETTA (da sostituire con il tuo hash)
const passwordHashCorretta = "b1f5906b2d723f4371bc64578e66559889be7643bfafbdde59ebe2693384a0b1";

  // Calcola hash della password inserita
  const enc = new TextEncoder().encode(pwd);
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  if (hashHex !== passwordHashCorretta) {
    alert("Password errata.");
    return;
  }

  // Se siamo qui → password ok
  for (const tipo in prezziDroga) {
    const input = document.getElementById("price-" + tipo);
    if (!input) continue;
    const val = parseFloat(input.value);
    if (!isNaN(val) && val >= 0) {
      prezziDroga[tipo] = val;
    }
  }

  salvaPrezzi();
  alert("Prezzi aggiornati.");
  mostraRisultati();
}



// Prezzo unitario basato su alias + prezziDroga
function getPrezzoUnitario(tipo) {
    tipo = tipo.toLowerCase();
    for (const [tipoCanonico, alias] of Object.entries(sostanzeMappa)) {
        if (alias.includes(tipo)) {
            return prezziDroga[tipoCanonico] || 0;
        }
    }
    return 0;
}

// Aggiunta droghe cliccando i chip
function aggiungiDroga(tipo, campoId) {
    const input = document.getElementById(campoId);
    if (!input) return;

    let val = input.value;
    if (val === "") {
        // campo vuoto → solo tipo
        input.value = tipo;
        input.focus();
        return;
    }

    // togli solo gli spazi finali, non quelli all'inizio
    let trimmedVal = val.replace(/\s+$/g, "");

    // se dopo aver tolto gli spazi è vuoto
    if (trimmedVal === "") {
        input.value = tipo;
        input.focus();
        return;
    }

    // ultimo segmento dopo l'ultima virgola
    const lastSegment = trimmedVal.split(",").pop().trim();
    const soloNumeroSegmentoFinale = /^\d+$/.test(lastSegment);

    if (soloNumeroSegmentoFinale) {
        // Esempio:
        // "100"                    -> "100 cocaina, "
        // "100 cocaina, 200"       -> "100 cocaina, 200 cocaina, "
        input.value = trimmedVal + " " + tipo + ", ";
    } else {
        // caso generico:
        // "cocaina"                -> "cocaina, ketamina"
        // "100 cocaina"            -> "100 cocaina, ketamina"
        if (!trimmedVal.endsWith(",")) trimmedVal += ",";
        input.value = trimmedVal + " " + tipo;
    }

    input.focus();
}



// Aggiunta dal form
function aggiungiRisultato() {
    const nomeFamiglia = document.getElementById("famiglia").value.trim();
    const sostanze = document
        .getElementById("sostanze")
        .value.split(",");
    const gratuite = document
        .getElementById("gratuita")
        .value.split(",");
    const sanzione =
        parseFloat(document.getElementById("sanzione").value) || 0;

    if (!nomeFamiglia || (sostanze.length === 0 && gratuite.length === 0)) {
        alert("Per favore, completa tutti i campi correttamente!");
        return;
    }

    let totale = 0;
    let dettagli = "";

    sostanze.forEach((sostanza) => {
        if (sostanza.trim() === "") return;
        const [quantita, ...tipoParts] = sostanza.trim().split(/\s+/);
        const tipo = tipoParts.join(" ");
        const quantitaNum = parseFloat(quantita);
        if (isNaN(quantitaNum)) return;
        const tipoNormalizzato = normalizzaTipo(tipo);
        const prezzoUnitario = getPrezzoUnitario(tipoNormalizzato);
        const valore = quantitaNum * prezzoUnitario;
        totale += valore;
        if (prezzoUnitario === 0) {
            const suggerimento = suggerisciDroga(tipoNormalizzato);
            if (suggerimento) {
                dettagli += `• ${quantitaNum} ${tipoNormalizzato} (⚠️ prezzo non impostato – forse intendevi: <strong>${suggerimento}</strong>)<br>`;
            } else {
                dettagli += `• ${quantitaNum} ${tipoNormalizzato} (⚠️ prezzo non impostato – nessun suggerimento)<br>`;
            }
        } else {
            dettagli += `• ${quantitaNum} ${tipoNormalizzato} (${formattaNumero(
                valore
            )}€)<br>`;
        }
    });

    if (gratuite.some((g) => g.trim() !== "")) {
        dettagli += `<br><strong>Droghe sanzione :</strong><br>`;
        gratuite.forEach((sostanza) => {
            if (sostanza.trim() === "") return;
            const [quantita, ...tipoParts] = sostanza.trim().split(/\s+/);
            const tipo = tipoParts.join(" ");
            const quantitaNum = parseFloat(quantita);
            if (isNaN(quantitaNum)) return;
            const tipoNormalizzato = normalizzaTipo(tipo);
            dettagli += `• ${quantitaNum} ${tipoNormalizzato} (GRATIS)<br>`;
        });
    }

    const sanzioneRidotta = sanzione * 0.8;
    const totaleNetto = totale - sanzioneRidotta;

    risultati.push({
        famiglia: nomeFamiglia,
        totale: totale,
        dettagli: dettagli,
        sanzione: sanzione,
        totaleNetto: totaleNetto,
    });

    salvaDati();
    pulisciCampi();
    mostraRisultati();
}

function mostraRisultati() {
    const container = document.getElementById("result");
    const target = document.getElementById("totale");
    if (!risultati.length) {
        container.style.display = "block";
        target.innerHTML = "<em>Nessun risultato ancora. Aggiungi una famiglia.</em>";
        return;
    }

    target.innerHTML = "Caricamento...";
    container.style.display = "block";

    // Ordina per totale netto
    risultati.sort((a, b) => b.totaleNetto - a.totaleNetto);

    let resultText = "";

    risultati.forEach((fam) => {
        if (fam) {
            const intestazione =
                fam.totaleNetto >= 0
                    ? `${fam.famiglia} – ${formattaNumero(fam.totaleNetto)}€`
                    : `${fam.famiglia} – 🔻 Da prelevare: ${formattaNumero(
                        Math.abs(fam.totaleNetto)
                    )}€`;

            let sanzioneText = "";
            if (fam.sanzione > 0) {
                sanzioneText = `<div class="sanzione">💸 Sanzione : ${formattaNumero(
                    fam.sanzione * 0.8
                )}€</div>`;
            }

            resultText += `
  <div class="famiglia">${intestazione}</div>
  <div class="dettagli">${fam.dettagli}</div>
  ${sanzioneText}
  <div class="totale-netto">
    ${fam.totaleNetto >= 0
                    ? `➡️ Totale netto: ${formattaNumero(fam.totaleNetto)}€`
                    : `🔻 Da prelevare: ${formattaNumero(Math.abs(fam.totaleNetto))}€`
                }
  </div>

  <button onclick="modificaFamiglia(${risultati.indexOf(fam)})" style="background:#f59e0b;color:white;margin-right:5px;">Modifica</button>
  <button onclick="eliminaFamiglia(${risultati.indexOf(fam)})" style="background:#ef4444;color:white;">Elimina</button>

  <br><br>
`;

        }
    });

    target.innerHTML = resultText;
}

// Parsing da textarea "inserimento veloce"
function processInput() {
    const inputText = document.getElementById("inputArea").value.trim();
    if (!inputText) {
        alert("Per favore, completa il campo correttamente!");
        return;
    }

    const families = parseFamilies(inputText);

    families.forEach((fam) => {
        risultati.push({
            famiglia: fam.intestazione,
            totale: fam.totale,
            dettagli: fam.dettagli,
            sanzione: fam.sanzione,
            totaleNetto: fam.totaleNetto,
        });
    });

    salvaDati();
    mostraRisultati();
}

function parseFamilies(input) {
    return input
        .split("\n")
        .filter(Boolean)
        .map((line) => {
            const [familyName, drugsString] = line
                .split(":")
                .map((str) => str.trim());

            if (!familyName || !drugsString) return null;

            const [paidDrugsPart, sanctionAndSanctionDrugsPart] = drugsString
                .split("|")
                .map((str) => str.trim());

            const paidDrugs = paidDrugsPart.split("/").map((drugEntry) => {
                const parts = drugEntry.trim().split(" ");
                const quantity = Number(parts[0]);
                const tipoDroga = parts.slice(1).join(" ");
                const tipoNormalizzato = normalizzaTipo(tipoDroga);
                const prezzoUnitario = getPrezzoUnitario(tipoNormalizzato);
                const valoreTotale = quantity * prezzoUnitario;

                return {
                    quantity,
                    tipoDroga: tipoNormalizzato,
                    valoreTotale,
                    prezzoUnitario,
                };
            });

            let sanction = 0;
            let sanctionDrugs = [];

            if (sanctionAndSanctionDrugsPart) {
                const sanctionParts = sanctionAndSanctionDrugsPart
                    .split("/")
                    .map((str) => str.trim());

                if (sanctionParts.length > 0) {
                    sanction = parseFloat(sanctionParts[0]) || 0;

                    sanctionDrugs = sanctionParts.slice(1).map((drugEntry) => {
                        const parts = drugEntry.trim().split(" ");
                        const quantity = Number(parts[0]);
                        const tipoDroga = parts.slice(1).join(" ");
                        const tipoNormalizzato = normalizzaTipo(tipoDroga);

                        return {
                            quantity,
                            tipoDroga: tipoNormalizzato,
                        };
                    });
                }
            }

            const dettagliVendita = paidDrugs
                .map((d) =>
                    d.prezzoUnitario === 0
                        ? (() => {
                            const sug = suggerisciDroga(d.tipoDroga);
                            if (sug) {
                                return `• ${d.quantity} ${d.tipoDroga} (⚠️ prezzo non impostato – forse intendevi: ${sug})`;
                            }
                            return `• ${d.quantity} ${d.tipoDroga} (⚠️ prezzo non impostato – nessun suggerimento)`;
                        })()
                        : `• ${d.quantity} ${d.tipoDroga} (${formattaNumero(
                            d.valoreTotale
                        )}€)`
                )
                .join("<br>");

            const dettagliSanzione =
                sanctionDrugs.length > 0
                    ? `<br><strong>Droghe sanzione :</strong><br>` +
                    sanctionDrugs
                        .map(
                            (d) =>
                                `• ${d.quantity} ${d.tipoDroga} (GRATIS)`
                        )
                        .join("<br>")
                    : "";

            const totalePagato = paidDrugs.reduce(
                (acc, d) => acc + d.valoreTotale,
                0
            );

            return {
                intestazione: familyName,
                dettagli: dettagliVendita + dettagliSanzione,
                totale: totalePagato,
                sanzione: sanction,
                totaleNetto: totalePagato - sanction * 0.8,
            };
        })
        .filter(Boolean);
}

// Export
function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


/*
  function exportJSON() {
    if (!risultati.length) {
      alert("Nessun dato da esportare.");
      return;
    }
    downloadFile(
      "report_sostanze.json",
      JSON.stringify(risultati, null, 2),
      "application/json"
    );
  }

  function exportCSV() {
    if (!risultati.length) {
      alert("Nessun dato da esportare.");
      return;
    }
    const header = ["famiglia", "totale", "sanzione", "totaleNetto"];
    const rows = risultati.map((r) => [
      r.famiglia,
      r.totale,
      r.sanzione,
      r.totaleNetto,
    ]);
    const csv = [header.join(";")]
      .concat(
        rows.map((row) =>
          row
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(";")
        )
      )
      .join("\n");
    downloadFile("report_sostanze.csv", csv, "text/csv");
  }
  */

// ====== COPIA REPORT ======
function copiaReport() {
    if (!risultati.length) {
        alert("Nessun dato da copiare.");
        return;
    }

    let testo = "PAGAMENTI MAFIE/GANG\n\n";

    risultati.forEach((fam) => {

        // Titolo famiglia
        if (fam.totaleNetto >= 0) {
            testo += `${fam.famiglia} – ${formattaNumero(fam.totaleNetto)}€\n`;
        } else {
            testo += `${fam.famiglia} – 🔻 Da prelevare: ${formattaNumero(Math.abs(fam.totaleNetto))}€\n`;
        }

        // Dettagli puliti
        let dettagli = fam.dettagli
            .replace(/<br>/g, "\n")
            .replace(/<[^>]*>/g, "")
            .trim(); // ← elimina spazi e righe vuote finali

        // Rimuove eventuali righe vuote doppie
        dettagli = dettagli.replace(/\n{2,}/g, "\n");

        testo += dettagli + "\n";

        // Sanzione (attaccata ai dettagli, NO SPAZI)
        if (fam.sanzione > 0) {
            testo += `💸 Sanzione : ${formattaNumero(fam.sanzione * 0.8)}€\n`;
        }

        // Totale netto subito sotto, NESSUNA RIGA VUOTA PRIMA
        if (fam.totaleNetto >= 0) {
            testo += `➡️ Totale netto: ${formattaNumero(fam.totaleNetto)}€\n`;
        } else {
            testo += `🔻 Da prelevare: ${formattaNumero(Math.abs(fam.totaleNetto))}€\n`;
        }

        // Riga vuota SOLO tra famiglie
        testo += `\n`;
    });

    navigator.clipboard.writeText(testo).then(() => {
        alert("Report copiato negli appunti.");
    });
}


// === DARK MODE ===
const toggle = document.getElementById("themeToggle");

// Carica tema da localStorage
if (localStorage.getItem("tema") === "dark") {
    document.body.classList.add("dark");
    toggle.textContent = "☀️ Light Mode";
}

// Clic sul toggle
toggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        localStorage.setItem("tema", "dark");
        toggle.textContent = "☀️ Light Mode";
    } else {
        localStorage.setItem("tema", "light");
        toggle.textContent = "🌙 Dark Mode";
    }
});



// ====== ELIMINA / MODIFICA SINGOLA FAMIGLIA ======
function eliminaFamiglia(index) {
    if (!confirm("Eliminare questa famiglia?")) return;
    risultati.splice(index, 1);
    salvaDati();
    mostraRisultati();
}

function modificaFamiglia(index) {
    const fam = risultati[index];

    // Rimetti nel form i dati originali
    document.getElementById("famiglia").value = fam.famiglia;
    document.getElementById("sostanze").value = estraiSostanzeDaDettagli(fam.dettagli, false);
    document.getElementById("gratuita").value = estraiSostanzeDaDettagli(fam.dettagli, true);
    document.getElementById("sanzione").value = fam.sanzione;

    // Rimuovi temporaneamente la famiglia dalla lista
    risultati.splice(index, 1);
    salvaDati();
    mostraRisultati();
}

// Estrae sostanze normali o gratuite dal dettaglio HTML
function estraiSostanzeDaDettagli(dettagli, gratuite = false) {
    const lines = dettagli.replace(/<br>/g, "\n").split("\n").map(s => s.trim());
    let output = [];

    let inGratis = false;

    for (let line of lines) {
        if (line.toLowerCase().includes("droghe sanzione")) {
            inGratis = true;
            continue;
        }

        if (!line.startsWith("•")) continue;
        if (inGratis !== gratuite) continue;

        const cleaned = line
            .replace("•", "")
            .replace("(GRATIS)", "")
            .replace("(⚠️ prezzo non impostato)", "")
            .replace(/\(.*?\)/, "")
            .trim();

        if (cleaned) output.push(cleaned);
    }

    return output.join(", ");
}


window.onload = function () {
    caricaPrezzi();
    popolaFormPrezzi();
    caricaDati();

};

