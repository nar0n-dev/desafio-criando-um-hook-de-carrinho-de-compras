import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product} from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const oQueTemNoCarrinho = [...cart]
      const produtoJaExisteNoCarrinho = oQueTemNoCarrinho.find(obj => obj.id === productId)

      const temNoEstoque = await api.get(`/stock/${productId}`)
      const quantidadeDeProdutoNoEstoque = temNoEstoque.data.amount
      const quantidadeDeProdutoNoCarrinho = produtoJaExisteNoCarrinho ? produtoJaExisteNoCarrinho.amount : 0

      //O valor atualizado do carrinho deve ser perpetuado no localStorage utilizando o método setItem.
      const quantidadeDesejadaPeloCliente = quantidadeDeProdutoNoCarrinho + 1
      
      //Verificar se existe no estoque a quantidade desejada do produto. Caso contrário, utilizar o método error da react-toastify com a seguinte mensagem:
      if (quantidadeDesejadaPeloCliente > quantidadeDeProdutoNoEstoque) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (produtoJaExisteNoCarrinho) {
        produtoJaExisteNoCarrinho.amount = quantidadeDesejadaPeloCliente
      } else {
        const produtoDesejado = await api.get(`/products/${productId}`)
        const adicionarEsteProduto = {...produtoDesejado.data, amount: 1}
        oQueTemNoCarrinho.push(adicionarEsteProduto)
      }

      setCart(oQueTemNoCarrinho)

      //O valor atualizado do carrinho deve ser perpetuado no localStorage utilizando o método setItem.
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(oQueTemNoCarrinho))

    } catch {
      //Capturar utilizando trycatch os erros que ocorrerem ao longo do método e, no catch, utilizar o método error da react-toastify com a seguinte mensagem:
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const oQueTemNoCarrinho = [...cart];
      const encontrandoItem = oQueTemNoCarrinho.findIndex(item => {
        return(
          item.id === productId
        ) 
      });

      if(encontrandoItem >= 0){
        oQueTemNoCarrinho.splice(encontrandoItem, 1)

        //O valor atualizado do carrinho deve ser perpetuado no localStorage utilizando o método setItem.
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(oQueTemNoCarrinho))
        setCart(oQueTemNoCarrinho)
      }else{
        toast.error('Erro na remoção do produto');
      }
      
    } catch {
      //Capturar utilizando trycatch os erros que ocorrerem ao longo do método e, no catch, utilizar o método error da react-toastify com a seguinte mensagem:
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) {
        return;
      }
    
      const temNoEstoque = await api.get(`/stock/${productId}`)
      const quantidadeDeProdutoNoEstoque = temNoEstoque.data.amount
      
      if (amount > quantidadeDeProdutoNoEstoque) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const oQueTemNoCarrinho = [...cart];
       const produtoJaExisteNoCarrinho = oQueTemNoCarrinho.find(obj => obj.id === productId)

      if (produtoJaExisteNoCarrinho) {
        produtoJaExisteNoCarrinho.amount = amount
        setCart(oQueTemNoCarrinho)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(oQueTemNoCarrinho))
      } else {
        throw Error
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);
  return context;
}
