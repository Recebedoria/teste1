# Sistema de Diferenças — DEMO (estático)
Este pacote entrega um protótipo **estático** (HTML/CSS/JS) que simula o sistema descrito. Não há backend: os dados ficam no `localStorage` do navegador.

## Como usar
1. Extraia o ZIP.
2. Abra `index.html` no navegador.
3. Faça login com o **Administrador** padrão:
   - Matrícula: `0001`
   - Senha: `Admin@123!`
4. Cadastre novos usuários pelo botão **Novo usuário** na tela de login.

## Regras implementadas
- **Cadastro**: nome, matrícula (única), tipo (Usuário comum, Gerente, Diretor), senha + confirmação.
- **Validação de senha**: exige 1 maiúscula, 1 número, 1 caractere especial.
- **Olho** para visualizar senha no login e no cadastro.
- **Pós-cadastro**: retorna à tela de login.
- **Perfis**:
  - Usuário comum: lança e vê seus próprios lançamentos; subtotal de valores `< -5,00` e valor a restituir (módulo do subtotal).
  - Gerente: pode receber permissões específicas (ex.: gerenciar permissões).
  - Diretor: consulta de todos os usuários.
  - **ALPHA RED** (matrícula `0001`) é administrador e pode designar/retirar administrador.
- **Tela principal**: menu (Início, novo relatório, consulta, permissões) e caixa do usuário (nome, matrícula, tipo, foto, sair).
- **Marca d’água**: imagem remota definida em `styles.css`. (Se a URL expirar, altere a propriedade `background` da classe `.watermark`.)

## Observações
- Por ser demo local, **não use dados reais**.
- Para persistência real, adicione uma API e troque o `localStorage` por um banco de dados.
