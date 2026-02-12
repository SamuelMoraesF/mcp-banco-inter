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

export interface ExtratoTransaction {
    dataLancamento: string;
    tipoLancamento: string;
    tipoOperacao: string;
    valor: string;
    titulo: string;
    descricao: string;
}

export interface ExtratoResponse {
    transacoes: ExtratoTransaction[];
}

export interface Pagador {
    cpfCnpj: string;
    tipoPessoa: 'FISICA' | 'JURIDICA';
    nome: string;
    endereco: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
}

// Partial definition of CobrancaDetalhe based on usage
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
    boleto?: unknown;
    pix?: unknown;
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

export interface CobrancaQueryParams {
    dataInicial: string;
    dataFinal: string;
    situacao?: 'RECEBIDO' | 'A_RECEBER' | 'ATRASADO' | 'CANCELADO';
    filtrarDataPor?: 'VENCIMENTO' | 'EMISSAO' | 'SITUACAO';
    pagina?: number;
    tamanhoPagina?: number;
    ordenarPor?: string;
    tipoOrdenacao?: 'ASC' | 'DESC';
}

export interface EmitirCobrancaRequest {
    seuNumero: string;
    valorNominal: number;
    dataVencimento: string;
    numDiasAgenda?: number;
    pagador: Pagador;
    mensagem?: {
        linha1?: string;
        linha2?: string;
        linha3?: string;
        linha4?: string;
        linha5?: string;
    };
    desconto1?: {
        codigoDesconto: string;
        taxa: number;
        valor: number;
        data: string;
    };
    desconto2?: {
        codigoDesconto: string;
        taxa: number;
        valor: number;
        data: string;
    };
    desconto3?: {
        codigoDesconto: string;
        taxa: number;
        valor: number;
        data: string;
    };
    multa?: {
        codigoMulta: string;
        taxa: number;
        valor: number;
        data: string;
    };
    mora?: {
        codigoMora: string;
        taxa: number;
        valor: number;
        data: string;
    };
}

export interface EmitirCobrancaResponse {
    codigoSolicitacao: string;
}

export interface CobrancaPdfResponse {
    pdf: string;
}

export interface CancelarCobrancaRequest {
    motivoCancelamento: string;
}

export interface SumarioCobrancaResponse {
    pagos: {
        quantidade: number;
        valor: number;
    };
    abertos: {
        quantidade: number;
        valor: number;
    };
    vencidos: {
        quantidade: number;
        valor: number;
    };
}

export interface GetExtratoParams {
    dataInicial: string;
    dataFinal: string;
}

export interface GetPdfBoletoParams {
    codigoSolicitacao: string;
}

export interface CancelarBoletoParams {
    codigoSolicitacao: string;
    motivo: string;
}

export interface GetSumarioParams {
    dataInicial: string;
    dataFinal: string;
    filtrarDataPor?: 'VENCIMENTO' | 'EMISSAO' | 'SITUACAO';
}
