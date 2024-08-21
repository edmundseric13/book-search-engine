import { useState, useEffect } from 'react';
import { Container, Col, Form, Button, Card, Row } from 'react-bootstrap';
import { useMutation, useLazyQuery } from '@apollo/client';
import Auth from '../utils/auth';
import { saveBookIds, getSavedBookIds } from '../utils/localStorage';
import { SAVE_BOOK } from '../utils/mutations';
import { SEARCH_BOOKS } from '../utils/queries';

const SearchBooks = () => {
  const [searchedBooks, setSearchedBooks] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [savedBookIds, setSavedBookIds] = useState(getSavedBookIds());

  const [saveBook] = useMutation(SAVE_BOOK);
  const [searchBooks, { loading, error: searchError }] = useLazyQuery(SEARCH_BOOKS, {
    onCompleted: (data) => {
      setSearchedBooks(data.searchBooks);
    },
    onError: (error) => {
      console.error('Search error:', error);
    },
  });

  useEffect(() => {
    return () => saveBookIds(savedBookIds);
  }, [savedBookIds]);

  const handleFormSubmit = async (event) => {
    event.preventDefault();
  
    if (!searchInput) {
      console.warn('Search input is empty.');
      return false;
    }
  
    console.log('Search input:', searchInput);
  
    try {
      const response = await searchBooks({ variables: { searchTerm: searchInput } });
      console.log('SearchBooks response:', response);
  
      const { data, error } = response;
      if (error) {
        console.error('ApolloError:', error);
      }
  
      if (!data || !data.searchBooks) {
        console.error('No data returned from searchBooks query.');
        return;
      }
  
      setSearchedBooks(data.searchBooks);
      setSearchInput('');
    } catch (err) {
      console.error('Error in handleFormSubmit:', err);
    }
  };

  const handleSaveBook = async (bookId) => {
    const bookToSave = searchedBooks.find((book) => book.bookId === bookId);
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
      await saveBook({
        variables: { bookData: { ...bookToSave } },
      });
      setSavedBookIds([...savedBookIds, bookToSave.bookId]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="text-light bg-dark p-5">
        <Container>
          <h1>Search for Books!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name='searchInput'
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type='text'
                  size='lg'
                  placeholder='Search for a book'
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type='submit' variant='success' size='lg'>
                  Submit Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>

      <Container>
        {loading ? (
          <h2>Loading...</h2>
        ) : searchError ? (
          <h2>Error: {searchError.message}</h2>
        ) : (
          <>
            <h2 className='pt-5'>
              {searchedBooks.length
                ? `Viewing ${searchedBooks.length} results:`
                : 'Search for a book to begin'}
            </h2>
            <Row>
              {searchedBooks.map((book) => {
                return (
                  <Col md="4" key={book.bookId}>
                    <Card border='dark'>
                      {book.image ? (
                        <Card.Img src={book.image} alt={`The cover for ${book.title}`} variant='top' />
                      ) : null}
                      <Card.Body>
                        <Card.Title>{book.title}</Card.Title>
                        <p className='small'>Authors: {book.authors}</p>
                        <Card.Text>{book.description}</Card.Text>
                        {Auth.loggedIn() && (
                          <Button
                            disabled={savedBookIds?.some((savedBookId) => savedBookId === book.bookId)}
                            className='btn-block btn-info'
                            onClick={() => handleSaveBook(book.bookId)}>
                            {savedBookIds?.some((savedBookId) => savedBookId === book.bookId)
                              ? 'This book has already been saved!'
                              : 'Save this Book!'}
                          </Button>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </>
        )}
      </Container>
    </>
  );
};

export default SearchBooks;