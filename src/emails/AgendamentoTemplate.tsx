import * as React from 'react';
import { Html, Body, Container, Text, Heading, Section, Row, Column, Hr } from '@react-email/components';

interface EmailProps {
  clienteNome: string;
  profissionalNome: string;
  servico: string;
  dataHora: string;
  preco: string;
  tipo: 'CLIENTE' | 'PROFISSIONAL';
}

export const AgendamentoEmail = ({
  clienteNome,
  profissionalNome,
  servico,
  dataHora,
  preco,
  tipo
}: EmailProps) => {
  const isCliente = tipo === 'CLIENTE';

  return (
    <Html>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Agendamento Confirmado! ✂️</Heading>
          
          <Text style={text}>
            {isCliente 
              ? `Olá ${clienteNome}, seu horário foi reservado com sucesso.` 
              : `Olá ${profissionalNome}, você tem um novo cliente agendado!`}
          </Text>

          <Section style={box}>
            <Text style={paragraph}><strong>Serviço:</strong> {servico}</Text>
            <Text style={paragraph}><strong>Data/Hora:</strong> {dataHora}</Text>
            <Text style={paragraph}><strong>Valor:</strong> {preco}</Text>
            <Hr style={hr} />
            <Text style={paragraph}>
              <strong>{isCliente ? 'Profissional:' : 'Cliente:'}</strong>{' '}
              {isCliente ? profissionalNome : clienteNome}
            </Text>
          </Section>

          <Text style={footer}>
            Hartmann Barbearia - O estilo que você merece.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Estilos simples inline para garantir compatibilidade com Gmail, Outlook, etc.
const main = { backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px' };
const box = { padding: '24px', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px solid #eee' };
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold', textAlign: 'center' as const, margin: '30px 0' };
const text = { color: '#333', fontSize: '16px', lineHeight: '24px', textAlign: 'center' as const };
const paragraph = { fontSize: '14px', lineHeight: '24px', color: '#555' };
const hr = { borderColor: '#e6ebf1', margin: '20px 0' };
const footer = { color: '#8898aa', fontSize: '12px', textAlign: 'center' as const, marginTop: '30px' };