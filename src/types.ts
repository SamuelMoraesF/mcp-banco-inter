export interface InterConfig {
    clientId: string;
    clientSecret: string;
    certPath: string;
    keyPath: string;
    contaCorrente?: string;
    isSandbox?: boolean;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

export interface SaldoResponse {
    disponivel: number;
}

export interface ExtratoResponse {
    transacoes: Array<{
        dataLancamento: string;
        tipoLancamento: string;
        tipoOperacao: string;
        valor: string;
        titulo: string;
        descricao: string;
    }>;
}

export interface CobrancaDetalhe {
    codigoSolicitacao: string;
    seuNumero: string;
    dataEmissao: string;
    dataVencimento: string;
    valorNominal: string;
    tipoCobranca: string;
    situacao: string;
    dataSituacao: string;
    valorTotalRecebido?: string;
    origemRecebimento?: string;
    pagador: {
        nome: string;
        cpfCnpj: string;
    };
}

export interface CobrancaItem {
    cobranca: CobrancaDetalhe;
    boleto?: any;
    pix?: any;
}

export interface ListCobrancasResponse {
    totalPaginas: number;
    totalElementos: number;
    tamanhoPagina: number;
    primeiraPagina: boolean;
    ultimaPagina: boolean;
    numeroDeElementos: number;
    cobrancas: CobrancaItem[];
}

export interface PixRequest {
    chave: string;
    valor: number;
    descricao?: string;
}

export interface PixResponse {
    endToEndId: string;
    status: string;
}
