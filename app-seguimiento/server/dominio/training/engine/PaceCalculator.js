/**
 * Calculadora lógica para ritmos de entrenamiento personalizados.
 * Determina zonas de intensidad basadas en las mejores marcas personales (PBs) del atleta.
 * 
 * @class PaceCalculator
 */
class PaceCalculator {
    /**
     * Calcula las zonas de ritmo de entrenamiento basadas en una mejor marca de referencia (ej: 5k o 10k).
     * Si no se dispone de marcas, asigna ritmos por defecto de nivel inicial.
     * 
     * @param {Object} userPBs - Mejores marcas del usuario, ej: { "5k": "20:00", "10k": "42:00" }
     * @returns {Object} Ritmos para diferentes zonas de intensidad en formato "MM:SS" (z1 a z5).
     */
    calculateZones(userPBs = {}, level = 'intermediate') {
        const userPBsObj = userPBs || {};
        const referenceTime = userPBsObj['5k'] || userPBsObj['10k'];
        const distance = userPBsObj['5k'] ? 5 : 10;

        if (!referenceTime) {
            // Ritmos por defecto calibrados según el NIVEL DE EXPERIENCIA del atleta
            if (level === 'advanced') {
                return {
                    z1: '5:30',
                    z2: '5:00',
                    z3: '4:30',
                    z4: '4:00',
                    z5: '3:30'
                };
            } else if (level === 'intermediate') {
                return {
                    z1: '6:30',
                    z2: '6:00',
                    z3: '5:15',
                    z4: '4:45',
                    z5: '4:15'
                };
            } else {
                // Principiante (beginner): Ritmos más asequibles y seguros
                return {
                    z1: '7:30',
                    z2: '7:00',
                    z3: '6:15',
                    z4: '5:45',
                    z5: '5:15'
                };
            }
        }

        const totalSeconds = this.timeToSeconds(referenceTime);
        const secondPerKm = totalSeconds / distance;

        return {
            z1: this.secondsToTime(secondPerKm * 1.22), // Recuperación / Recuperación activa
            z2: this.secondsToTime(secondPerKm * 1.14), // Aeróbico / Carrera larga (Long Run)
            z3: this.secondsToTime(secondPerKm * 1.05), // Umbral / Tempo
            z4: this.secondsToTime(secondPerKm * 0.96), // Intervalos / VO2Max
            z5: this.secondsToTime(secondPerKm * 0.86)  // Sprints / Velocidad pura
        };
    }

    /**
     * Convierte una cadena de tiempo en formato "MM:SS" o "MM" a su equivalente en segundos.
     * 
     * @param {string} timeStr - Cadena de tiempo (ej. "20:30").
     * @returns {number} Tiempo total expresado en segundos.
     */
    timeToSeconds(timeStr) {
        if (!timeStr) return 0;
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 2) {
            return (parts[0] * 60) + parts[1];
        }
        return parts[0] * 60; // Solo minutos
    }

    /**
     * Convierte una cantidad de segundos a formato de cadena "MM:SS".
     * 
     * @param {number} seconds - Cantidad de segundos a convertir.
     * @returns {string} Tiempo formateado en minutos y segundos (ej. "4:35").
     */
    secondsToTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.round(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
}

module.exports = PaceCalculator;

