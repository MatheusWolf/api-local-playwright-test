import { test, expect } from '@playwright/test';
import { login, loginNoNavegador, criarlivro, apagarlivro, apagaremprestimo, buscaremprestimoativo } from '../Support/api-helpers';
import { admin, leitor, novolivro } from '../Support/dados';

test.use({ baseURL: 'http://localhost:3000' });

let tokenAdmin: string;
let livro: number;

test.describe('Desafio 2: Criar livro (API), emprestar livro criado (Leitor) pela web e limpar livro)', () => {
  // -> Primeiro, criamos o livro pela API
  test.beforeEach(async ({ request, page }) => {
    // Acesso como administrador
    tokenAdmin = await login(request, admin.email, admin.senha);

    // Cria o livro com quantidade 1 pela API
    livro = await criarlivro(request, tokenAdmin, novolivro(1));

    // Fazer login como leitor
    await loginNoNavegador(page, request, leitor.email, leitor.senha);
  });

  test('Emprestar livro com perfil de leitor', async ({ page, request }) => {
    // Verifico se o livro consta na listagem e se está disponível para empréstimo
    await page.goto('/livros');
    await expect(page.getByTestId(`livro-linha-${livro}`)).toBeVisible();
    await expect(page.getByTestId(`livro-titulo-${livro}`)).toHaveText('Livro do Teste');
    await expect(page.getByTestId(`livro-autor-${livro}`)).toHaveText('Autora Inventada');
    await expect(page.getByTestId(`livro-disponibilidade-${livro}`)).toHaveText('Disponível')
    
    // Entro na pagina do livro
    await expect(page.getByTestId(`livro-linha-${livro}`)).toBeVisible();
    await page.getByTestId(`livro-link-${livro}`).click();

    // Empresto e verifico se está indisponível
    await page.getByTestId('botao-emprestar').click();
    await expect(page.getByTestId('mensagem-sucesso')).toBeVisible();
    await expect(page.getByTestId(`livro-disponibilidade`)).toHaveText('Indisponível');
  });

  test.afterEach(async ({ request }) => {
    // Busco o empréstimo ativo do livro para poder apagar, caso exista
    const idDoemprestimo = await buscaremprestimoativo(request, tokenAdmin, livro);
    // Apago o empréstimo e o livro, caso existam
    if (idDoemprestimo !== undefined) {
      await apagaremprestimo(request, tokenAdmin, idDoemprestimo).catch(() => {});
    }
    // Apaga o livro
    await apagarlivro(request, tokenAdmin, livro).catch(() => {});
  });
});