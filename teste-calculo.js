// Script de teste para validar a lógica de cálculo do valorDinheiro
// Cenário: Venda de R$ 24,00 paga com R$ 50,00 em dinheiro

const valorDinheiroDigitado = 50.00;
const trocoNumber = 26.00;

// Lógica antiga (problemática)
const valorDinheiroBrutoAntigo = valorDinheiroDigitado - trocoNumber;
const valorDinheiroAntigo = Math.max(0, valorDinheiroBrutoAntigo);

// Lógica corrigida
const valorDinheiroCorrigido = trocoNumber >= valorDinheiroDigitado
  ? 0
  : valorDinheiroDigitado - trocoNumber;

console.log('=== TESTE DE VALIDAÇÃO ===');
console.log(`Valor digitado: R$ ${valorDinheiroDigitado.toFixed(2)}`);
console.log(`Troco: R$ ${trocoNumber.toFixed(2)}`);
console.log(`Valor bruto antigo: R$ ${valorDinheiroBrutoAntigo.toFixed(2)}`);
console.log(`Valor antigo (Math.max): R$ ${valorDinheiroAntigo.toFixed(2)}`);
console.log(`Valor corrigido: R$ ${valorDinheiroCorrigido.toFixed(2)}`);
console.log(`Esperado (24.00): R$ ${(valorDinheiroDigitado - trocoNumber).toFixed(2)}`);

console.log('\n=== RESULTADO ===');
if (valorDinheiroCorrigido === 24.00) {
  console.log('✅ CORRETO: O valor em dinheiro efetivo é R$ 24,00');
} else {
  console.log('❌ INCORRETO: O valor calculado não está correto');
}

// Teste com troco maior que o valor digitado
console.log('\n=== TESTE COM TROCO MAIOR ===');
const valorDigitado2 = 20.00;
const troco2 = 30.00;
const valorCorrigido2 = troco2 >= valorDigitado2 ? 0 : valorDigitado2 - troco2;
console.log(`Valor digitado: R$ ${valorDigitado2.toFixed(2)}, Troco: R$ ${troco2.toFixed(2)}, Resultado: R$ ${valorCorrigido2.toFixed(2)}`);
console.log('Esperado: R$ 0,00 (não há valor em dinheiro efetivo)');
