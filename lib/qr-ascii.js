"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRCodeASCII = generateQRCodeASCII;
exports.generateQRCodeCompactASCII = generateQRCodeCompactASCII;
var qrcode_1 = __importDefault(require("qrcode"));
/**
 * Gera QR Code em formato ASCII para impressão em cupom de texto
 * @param text Texto para gerar o QR code
 * @param options Opções de configuração
 */
function generateQRCodeASCII(text_1) {
    return __awaiter(this, arguments, void 0, function (text, options) {
        var _a, width, _b, margin, _c, inverse, qrMatrix, modules, size, darkModule, lightModule, asciiArt, i, y, x, isDark, i, error_1;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 3]);
                    _a = options.width, width = _a === void 0 ? 25 : _a, _b = options.margin, margin = _b === void 0 ? 1 : _b, _c = options.inverse, inverse = _c === void 0 ? false : _c;
                    return [4 /*yield*/, qrcode_1.default.create(text, {
                            errorCorrectionLevel: 'L', // Baixo para economizar espaço
                            version: undefined // Auto-detect
                        })];
                case 1:
                    qrMatrix = _d.sent();
                    modules = qrMatrix.modules;
                    size = modules.size;
                    darkModule = inverse ? ' ' : '█';
                    lightModule = inverse ? '█' : ' ';
                    asciiArt = '';
                    // Margem superior
                    for (i = 0; i < margin; i++) {
                        asciiArt += ' '.repeat(size + margin * 2) + '\n';
                    }
                    // Renderizar cada linha da matriz
                    for (y = 0; y < size; y++) {
                        // Margem esquerda
                        asciiArt += ' '.repeat(margin);
                        // Pixels da linha
                        for (x = 0; x < size; x++) {
                            isDark = modules.get(x, y);
                            asciiArt += isDark ? darkModule : lightModule;
                        }
                        // Margem direita
                        asciiArt += ' '.repeat(margin) + '\n';
                    }
                    // Margem inferior
                    for (i = 0; i < margin; i++) {
                        asciiArt += ' '.repeat(size + margin * 2) + '\n';
                    }
                    return [2 /*return*/, asciiArt];
                case 2:
                    error_1 = _d.sent();
                    console.error('Erro ao gerar QR Code ASCII:', error_1);
                    return [2 /*return*/, "\n\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n\u2502  QR CODE ERROR \u2502\n\u2502   Scan failed  \u2502\n\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n"];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Gera QR Code ASCII mais compacto usando caracteres de bloco
 */
function generateQRCodeCompactASCII(text) {
    return __awaiter(this, void 0, void 0, function () {
        var qrMatrix, modules, size, asciiArt, y, x, topDark, bottomDark, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, qrcode_1.default.create(text, {
                            errorCorrectionLevel: 'L',
                            version: undefined
                        })];
                case 1:
                    qrMatrix = _a.sent();
                    modules = qrMatrix.modules;
                    size = modules.size;
                    asciiArt = '';
                    // Usar caracteres de meio bloco para economizar altura
                    for (y = 0; y < size; y += 2) {
                        for (x = 0; x < size; x++) {
                            topDark = modules.get(x, y);
                            bottomDark = y + 1 < size ? modules.get(x, y + 1) : false;
                            if (topDark && bottomDark) {
                                asciiArt += '█'; // Bloco cheio
                            }
                            else if (topDark && !bottomDark) {
                                asciiArt += '▀'; // Meio bloco superior  
                            }
                            else if (!topDark && bottomDark) {
                                asciiArt += '▄'; // Meio bloco inferior
                            }
                            else {
                                asciiArt += ' '; // Vazio
                            }
                        }
                        asciiArt += '\n';
                    }
                    return [2 /*return*/, asciiArt];
                case 2:
                    error_2 = _a.sent();
                    console.error('Erro ao gerar QR Code ASCII compacto:', error_2);
                    return [2 /*return*/, '[QR ERROR]'];
                case 3: return [2 /*return*/];
            }
        });
    });
}
