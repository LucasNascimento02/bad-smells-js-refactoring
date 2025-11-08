// Constantes para evitar números mágicos
const MAX_USER_ITEM_VALUE = 500;
const ADMIN_PRIORITY_THRESHOLD = 1000;

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo.
   * - Users comuns só veem itens com valor <= 500.
   */
  generateReport(reportType, user, items) {
    const formatter = this.createFormatter(reportType, user);
    let total = 0;

    formatter.writeHeader();

    for (const item of items) {
      if (this.shouldIncludeItem(item, user)) {
        this.processItemPriority(item, user);
        formatter.writeItem(item, user);
        total += item.value;
      }
    }

    formatter.writeFooter(total);

    return formatter.getReport();
  }

  /**
   * Cria o formatador apropriado baseado no tipo de relatório
   */
  createFormatter(reportType, user) {
    if (reportType === 'CSV') {
      return new CSVFormatter();
    } else if (reportType === 'HTML') {
      return new HTMLFormatter(user);
    }
    throw new Error(`Tipo de relatório desconhecido: ${reportType}`);
  }

  /**
   * Verifica se um item deve ser incluído no relatório baseado no papel do usuário
   */
  shouldIncludeItem(item, user) {
    if (user.role === 'ADMIN') {
      return true;
    } else if (user.role === 'USER') {
      return item.value <= MAX_USER_ITEM_VALUE;
    }
    return false;
  }

  /**
   * Processa a prioridade de um item para admins
   */
  processItemPriority(item, user) {
    if (user.role === 'ADMIN' && item.value > ADMIN_PRIORITY_THRESHOLD) {
      item.priority = true;
    }
  }
}

/**
 * Classe base abstrata para formatadores de relatório
 */
class ReportFormatter {
  constructor() {
    this.report = '';
  }

  writeHeader() {
    throw new Error('Método writeHeader deve ser implementado');
  }

  writeItem(_item, _user) {
    throw new Error('Método writeItem deve ser implementado');
  }

  writeFooter(_total) {
    throw new Error('Método writeFooter deve ser implementado');
  }

  getReport() {
    return this.report.trim();
  }
}

/**
 * Formatador para relatórios CSV
 */
class CSVFormatter extends ReportFormatter {
  writeHeader() {
    this.report += 'ID,NOME,VALOR,USUARIO\n';
  }

  writeItem(item, user) {
    this.report += `${item.id},${item.name},${item.value},${user.name}\n`;
  }

  writeFooter(total) {
    this.report += '\nTotal,,\n';
    this.report += `${total},,\n`;
  }
}

/**
 * Formatador para relatórios HTML
 */
class HTMLFormatter extends ReportFormatter {
  constructor(user) {
    super();
    this.user = user;
  }

  writeHeader() {
    this.report += '<html><body>\n';
    this.report += '<h1>Relatório</h1>\n';
    this.report += `<h2>Usuário: ${this.user.name}</h2>\n`;
    this.report += '<table>\n';
    this.report += '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n';
  }

  writeItem(item, _user) {
    const style = this.getItemStyle(item);
    this.report += `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
  }

  writeFooter(total) {
    this.report += '</table>\n';
    this.report += `<h3>Total: ${total}</h3>\n`;
    this.report += '</body></html>\n';
  }

  /**
   * Retorna o estilo HTML para um item, baseado na prioridade
   */
  getItemStyle(item) {
    if (item.priority) {
      return ' style="font-weight:bold;"';
    }
    return '';
  }
}

