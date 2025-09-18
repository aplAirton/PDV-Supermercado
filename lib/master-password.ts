/**
 * Módulo de Geração e Validação de Senha Mestra
 * 
 * Sistema de segurança baseado em cálculo matemático da hora atual:
 * 1. Pega hora atual no formato 24h (ex: 12:45 = 1245)
 * 2. Eleva ao quadrado (1245² = 1,550,025)
 * 3. Divide por π (3.14)
 * 4. Pega os 4 primeiros dígitos ignorando decimais
 * 
 * Exemplo: 12:45 → 1245² = 1,550,025 → 1,550,025 ÷ 3.14 = 493,642... → Senha: 4936
 */

const PI = 3.14; // Valor invariável conforme especificação

/**
 * Gera a senha mestra para a hora atual
 * @returns {string} Senha mestra de 4 dígitos
 */
export function generateMasterPassword(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  
  // Formar número da hora (ex: 12:45 = 1245)
  const timeNumber = parseInt(`${hours}${minutes}`);
  
  // Elevar ao quadrado
  const squared = Math.pow(timeNumber, 2);
  
  // Dividir por PI
  const divided = squared / PI;
  
  // Pegar os 4 primeiros dígitos (ignorando decimais)
  const masterPassword = Math.floor(divided).toString().substring(0, 4).padStart(4, '0');
  
  console.log(`[MASTER PASSWORD] Hora: ${hours}:${minutes} → ${timeNumber} → ${timeNumber}² = ${squared} → ${squared}÷${PI} = ${divided} → Senha: ${masterPassword}`);
  
  return masterPassword;
}

/**
 * Gera senha mestra para uma hora específica (para testes)
 * @param {string} time - Hora no formato "HH:MM"
 * @returns {string} Senha mestra de 4 dígitos
 */
export function generateMasterPasswordForTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const timeNumber = parseInt(`${hours.padStart(2, '0')}${minutes.padStart(2, '0')}`);
  
  const squared = Math.pow(timeNumber, 2);
  const divided = squared / PI;
  const masterPassword = Math.floor(divided).toString().substring(0, 4).padStart(4, '0');
  
  console.log(`[MASTER PASSWORD TEST] Hora: ${time} → ${timeNumber} → ${timeNumber}² = ${squared} → ${squared}÷${PI} = ${divided} → Senha: ${masterPassword}`);
  
  return masterPassword;
}

/**
 * Valida se a senha fornecida confere com a senha mestra atual
 * @param {string} inputPassword - Senha fornecida pelo usuário
 * @returns {boolean} True se a senha está correta
 */
export function validateMasterPassword(inputPassword: string): boolean {
  const currentMasterPassword = generateMasterPassword();
  const isValid = inputPassword === currentMasterPassword;
  
  console.log(`[MASTER PASSWORD VALIDATION] Input: ${inputPassword} | Expected: ${currentMasterPassword} | Valid: ${isValid}`);
  
  return isValid;
}

/**
 * Gera informações de debug da senha mestra atual
 * @returns {object} Informações detalhadas do cálculo
 */
export function getMasterPasswordInfo() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const timeNumber = parseInt(`${hours}${minutes}`);
  const squared = Math.pow(timeNumber, 2);
  const divided = squared / PI;
  const masterPassword = Math.floor(divided).toString().substring(0, 4).padStart(4, '0');
  
  return {
    currentTime: `${hours}:${minutes}`,
    timeNumber,
    squared,
    dividedByPI: divided,
    masterPassword,
    calculation: `${timeNumber}² ÷ ${PI} = ${divided}`,
    timestamp: new Date().toISOString()
  };
}

/**
 * Valida senha mestra com tolerância de ±1 minuto (para casos de mudança de minuto durante digitação)
 * @param {string} inputPassword - Senha fornecida pelo usuário
 * @returns {boolean} True se a senha está correta (considerando tolerância)
 */
export function validateMasterPasswordWithTolerance(inputPassword: string): boolean {
  const now = new Date();
  
  // Senha atual
  if (validateMasterPassword(inputPassword)) {
    return true;
  }
  
  // Testar 1 minuto atrás
  const oneMinuteAgo = new Date(now.getTime() - 60000);
  const hoursAgo = oneMinuteAgo.getHours().toString().padStart(2, '0');
  const minutesAgo = oneMinuteAgo.getMinutes().toString().padStart(2, '0');
  const passwordAgo = generateMasterPasswordForTime(`${hoursAgo}:${minutesAgo}`);
  
  if (inputPassword === passwordAgo) {
    console.log('[MASTER PASSWORD] Senha válida para 1 minuto atrás');
    return true;
  }
  
  // Testar 1 minuto à frente
  const oneMinuteAhead = new Date(now.getTime() + 60000);
  const hoursAhead = oneMinuteAhead.getHours().toString().padStart(2, '0');
  const minutesAhead = oneMinuteAhead.getMinutes().toString().padStart(2, '0');
  const passwordAhead = generateMasterPasswordForTime(`${hoursAhead}:${minutesAhead}`);
  
  if (inputPassword === passwordAhead) {
    console.log('[MASTER PASSWORD] Senha válida para 1 minuto à frente');
    return true;
  }
  
  return false;
}

// Exemplo de uso para demonstração
if (typeof window === 'undefined') { // Apenas no servidor
  console.log('[MASTER PASSWORD MODULE] Módulo inicializado');
  
  // Exemplos de teste
  console.log('Exemplo 12:45:', generateMasterPasswordForTime('12:45'));
  console.log('Exemplo 08:30:', generateMasterPasswordForTime('08:30'));
  console.log('Exemplo 23:59:', generateMasterPasswordForTime('23:59'));
}